package indexer

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/init0/flora/packages/eventbus"
	"github.com/init0/flora/packages/flo"
	"github.com/init0/flora/packages/models"
)

// mockFLO is a minimal FLO client that returns canned responses.
type mockFLO struct {
	blockCount int64
	blocks     map[int64]*flo.Block
	hashes     map[int64]string
	mempool    []string
}

func (m *mockFLO) GetBlockCount(ctx context.Context) (int64, error)          { return m.blockCount, nil }
func (m *mockFLO) GetBestBlockHash(ctx context.Context) (string, error)      { return "", nil }
func (m *mockFLO) GetBlockHash(ctx context.Context, h int64) (string, error) { return m.hashes[h], nil }
func (m *mockFLO) GetBlock(ctx context.Context, hash string) (*flo.Block, error) {
	for _, b := range m.blocks {
		if b.Hash == hash {
			return b, nil
		}
	}
	return nil, nil
}
func (m *mockFLO) GetBlockVerbose(ctx context.Context, hash string) (*flo.Block, error) {
	return m.GetBlock(ctx, hash)
}
func (m *mockFLO) GetRawTransaction(ctx context.Context, txid string) (*flo.Transaction, error) {
	return nil, nil
}
func (m *mockFLO) GetRawMempool(ctx context.Context) ([]string, error) { return m.mempool, nil }
func (m *mockFLO) GetBlockchainInfo(ctx context.Context) (*flo.BlockchainInfo, error) {
	return nil, nil
}
func (m *mockFLO) GetNetworkInfo(ctx context.Context) (*flo.NetworkInfo, error) { return nil, nil }
func (m *mockFLO) Ping(ctx context.Context) error                               { return nil }

// mockBus records published events for inspection.
type mockBus struct {
	events []publishedEvent
	done   chan struct{}
}

type publishedEvent struct {
	Subject string
	Data    []byte
}

func (m *mockBus) Publish(ctx context.Context, subject string, data []byte) error {
	m.events = append(m.events, publishedEvent{Subject: subject, Data: data})
	return nil
}
func (m *mockBus) Close() error { return nil }

func TestScanner_processNewBlocks(t *testing.T) {
	bus := &mockBus{events: make([]publishedEvent, 0)}

	f := &mockFLO{
		blockCount: 2,
		hashes: map[int64]string{
			1: "hash1",
			2: "hash2",
		},
		blocks: map[int64]*flo.Block{
			1: {
				Hash:              "hash1",
				Height:            1,
				Time:              100,
				Size:              1000,
				Weight:            4000,
				Version:           1,
				MerkleRoot:        "root1",
				Bits:              "1d00ffff",
				Nonce:             123,
				Difficulty:        1,
				Chainwork:         "cw1",
				PreviousBlockHash: "prev1",
			},
			2: {
				Hash:              "hash2",
				Height:            2,
				Time:              200,
				Size:              2000,
				Weight:            8000,
				Version:           1,
				MerkleRoot:        "root2",
				Bits:              "1d00ffff",
				Nonce:             456,
				Difficulty:        1.5,
				Chainwork:         "cw2",
				PreviousBlockHash: "hash1",
			},
		},
	}

	scanner := New(f, bus)
	scanner.height = 0

	ctx := context.Background()
	if err := scanner.processNewBlocks(ctx); err != nil {
		t.Fatalf("processNewBlocks: %v", err)
	}

	if len(bus.events) != 2 {
		t.Fatalf("expected 2 events, got %d", len(bus.events))
	}

	for i, e := range bus.events {
		if e.Subject != eventbus.SubjectBlockConnected {
			t.Errorf("event %d: subject = %q, want %q", i, e.Subject, eventbus.SubjectBlockConnected)
		}

		var bc models.BlockConnected
		if err := json.Unmarshal(e.Data, &bc); err != nil {
			t.Fatalf("event %d: unmarshal: %v", i, err)
		}
		if bc.Height != int64(i+1) {
			t.Errorf("event %d: height = %d, want %d", i, bc.Height, i+1)
		}
	}

	if scanner.height != 2 {
		t.Errorf("scanner height = %d, want 2", scanner.height)
	}
}

func TestScanner_mempoolChanges(t *testing.T) {
	bus := &mockBus{events: make([]publishedEvent, 0), done: make(chan struct{})}
	f := &mockFLO{
		blockCount: 0,
		hashes:     map[int64]string{},
		blocks:     map[int64]*flo.Block{},
		mempool:    []string{"tx1", "tx2"},
	}

	scanner := New(f, bus)
	scanner.mempool = map[string]struct{}{}

	ctx := context.Background()
	if err := scanner.syncMempool(ctx); err != nil {
		t.Fatalf("syncMempool: %v", err)
	}

	// Should have published 2 tx.mempool.added events
	var added int
	for _, e := range bus.events {
		if e.Subject == eventbus.SubjectTxMempoolAdded {
			added++
		}
	}
	if added != 2 {
		t.Errorf("expected 2 mempool added events, got %d", added)
	}

	// Now remove one tx and sync again
	bus.events = nil
	f.mempool = []string{"tx1"}

	if err := scanner.syncMempool(ctx); err != nil {
		t.Fatalf("syncMempool: %v", err)
	}

	var removed int
	for _, e := range bus.events {
		if e.Subject == eventbus.SubjectTxMempoolRemoved {
			removed++
			var mr models.TxMempoolRemoved
			json.Unmarshal(e.Data, &mr)
			if mr.TxID == "tx2" {
				break
			}
		}
	}
	if removed != 1 {
		t.Errorf("expected 1 mempool removed event, got %d", removed)
	}
}
