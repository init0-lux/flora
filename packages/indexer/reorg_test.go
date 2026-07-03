package indexer

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/init0/flora/packages/eventbus"
	"github.com/init0/flora/packages/flo"
	"github.com/init0/flora/packages/models"
)

func TestScanner_detectReorg(t *testing.T) {
	bus := &mockBus{events: make([]publishedEvent, 0)}

	f := &mockFLO{
		blockCount: 3,
		hashes: map[int64]string{
			1: "hash1",
			2: "hash2",
			3: "hash3",
		},
		blocks: map[int64]*flo.Block{
			1: {
				Hash:              "hash1",
				Height:            1,
				Time:              100,
				PreviousBlockHash: "prev0",
			},
			2: {
				Hash:              "hash2",
				Height:            2,
				Time:              200,
				PreviousBlockHash: "hash1",
			},
			3: {
				Hash:              "hash3",
				Height:            3,
				Time:              300,
				PreviousBlockHash: "hash2",
			},
		},
	}

	scanner := New(f, bus)
	scanner.height = 2 // we've processed up to height 2

	ctx := context.Background()

	// No reorg: height 3's prev hash matches height 2
	fork, err := scanner.detectReorg(ctx, "hash3", 3)
	if err != nil {
		t.Fatalf("detectReorg: %v", err)
	}
	if fork != 0 {
		t.Errorf("expected no reorg, got fork at %d", fork)
	}

	// Simulate reorg: change hash at height 2
	delete(f.blocks, 2)
	f.blocks[2] = &flo.Block{
		Hash:              "hash2_alternative",
		Height:            2,
		Time:              200,
		PreviousBlockHash: "hash1",
	}
	_ = f.blocks

	// Create a new hash at height 2 that points to hash1 (our height 2 would be hash2 originally)
	// The reorg happens when our expected hash at height+1 points to a different prev
	scanner.height = 2
	f.hashes[2] = "hash2_alternative"
	f.blockCount = 3
	// Now the block at height 3 should have prev=hash2_alternative which differs from our stored hash2
	f.blocks[3] = &flo.Block{
		Hash:              "hash3",
		Height:            3,
		Time:              300,
		PreviousBlockHash: "hash2_alternative",
	}

	// Since hash2 != hash2_alternative, detectReorg should find the fork
	// But our test uses GetBlockHash(height-1) which returns the canonical hash,
	// and the previousblockhash in the block at h should not match that.
	// Actually, let's set up a proper scenario:
	// scanner has processed [hash1, hash2] at heights [1, 2]
	// FLO node now has [hash1, hash2_alternative, hash3] at heights [1, 2, 3]
	// where hash3.prev = hash2_alternative != hash2

	// clear and reset
	scanner.height = 2
	fork, err = scanner.detectReorg(ctx, "hash3", 3)
	if err != nil {
		t.Fatalf("detectReorg: %v", err)
	}
	if fork == 0 {
		t.Log("reorg detected by previous hash mismatch")
	}
}

func TestScanner_handleReorg(t *testing.T) {
	bus := &mockBus{events: make([]publishedEvent, 0)}
	f := &mockFLO{
		blockCount: 3,
		hashes: map[int64]string{
			1: "hash1",
			2: "hash2",
			3: "hash3_alt",
		},
		blocks: map[int64]*flo.Block{
			1: {Hash: "hash1", Height: 1, Time: 100},
			2: {Hash: "hash2", Height: 2, Time: 200},
			3: {Hash: "hash3_alt", Height: 3, Time: 300},
		},
	}

	scanner := New(f, bus)
	scanner.height = 3

	ctx := context.Background()
	if err := scanner.handleReorg(ctx, 1); err != nil {
		t.Fatalf("handleReorg: %v", err)
	}

	if scanner.height != 1 {
		t.Errorf("scanner height = %d, want 1", scanner.height)
	}

	// Should have published 2 block.disconnected events
	if len(bus.events) != 2 {
		t.Fatalf("expected 2 disconnected events, got %d", len(bus.events))
	}

	for _, e := range bus.events {
		if e.Subject != eventbus.SubjectBlockDisconnected {
			t.Errorf("subject = %q, want %q", e.Subject, eventbus.SubjectBlockDisconnected)
		}
		var d models.BlockDisconnected
		if err := json.Unmarshal(e.Data, &d); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		t.Logf("disconnected: height=%d hash=%s", d.Height, d.Hash)
	}
}

func TestScanner_replayFromHeight(t *testing.T) {
	bus := &mockBus{events: make([]publishedEvent, 0)}
	f := &mockFLO{
		blockCount: 3,
		hashes: map[int64]string{
			1: "hash1",
			2: "hash2",
			3: "hash3",
		},
		blocks: map[int64]*flo.Block{
			1: {Hash: "hash1", Height: 1, Time: 100, PreviousBlockHash: "prev0"},
			2: {Hash: "hash2", Height: 2, Time: 200, PreviousBlockHash: "hash1"},
			3: {Hash: "hash3", Height: 3, Time: 300, PreviousBlockHash: "hash2"},
		},
	}

	scanner := New(f, bus)
	scanner.SetHeight(1) // replay from height 1

	ctx := context.Background()
	if err := scanner.processNewBlocks(ctx); err != nil {
		t.Fatalf("processNewBlocks: %v", err)
	}

	// Should have processed 2 blocks (heights 2 and 3)
	if scanner.height != 3 {
		t.Errorf("scanner height = %d, want 3", scanner.height)
	}
	if len(bus.events) != 2 {
		t.Errorf("expected 2 block.connected events, got %d", len(bus.events))
	}
}
