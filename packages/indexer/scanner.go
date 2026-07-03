package indexer

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/init0/flora/packages/eventbus"
	"github.com/init0/flora/packages/flo"
	"github.com/init0/flora/packages/models"
)

const (
	pollInterval    = 5 * time.Second
	mempoolInterval = 10 * time.Second
)

// interfacing the methods needed by scanner
type FLOClient interface {
	Ping(ctx context.Context) error
	GetBestBlockHash(ctx context.Context) (string, error)
	GetBlockCount(ctx context.Context) (int64, error)
	GetBlockHash(ctx context.Context, height int64) (string, error)
	GetBlock(ctx context.Context, hash string) (*flo.Block, error)
	GetBlockVerbose(ctx context.Context, hash string) (*flo.Block, error)
	GetRawTransaction(ctx context.Context, txid string) (*flo.Transaction, error)
	GetRawMempool(ctx context.Context) ([]string, error)
	GetBlockchainInfo(ctx context.Context) (*flo.BlockchainInfo, error)
	GetNetworkInfo(ctx context.Context) (*flo.NetworkInfo, error)
}

type EventPublisher interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Close() error
}

type Scanner struct {
	flo     FLOClient
	bus     EventPublisher
	height  int64
	mempool map[string]struct{}
	done    chan struct{}
}

// New creates a new Scanner.
func New(floClient FLOClient, bus EventPublisher) *Scanner {
	return &Scanner{
		flo:     floClient,
		bus:     bus,
		height:  0,
		mempool: make(map[string]struct{}),
		done:    make(chan struct{}),
	}
}

// Run starts the scanning loop. It blocks until the context is cancelled.
func (s *Scanner) Run(ctx context.Context) error {
	// Initialize from current chain tip.
	if err := s.initHeight(ctx); err != nil {
		return fmt.Errorf("chain-indexer: init: %w", err)
	}

	blockTicker := time.NewTicker(pollInterval)
	mempoolTicker := time.NewTicker(mempoolInterval)

	defer blockTicker.Stop()
	defer mempoolTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-blockTicker.C:
			if err := s.processNewBlocks(ctx); err != nil {
				return err
			}
		case <-mempoolTicker.C:
			if err := s.syncMempool(ctx); err != nil {
				return err
			}
		}
	}
}

// initHeight sets the starting height from the node's current tip.
func (s *Scanner) initHeight(ctx context.Context) error {
	count, err := s.flo.GetBlockCount(ctx)
	if err != nil {
		return fmt.Errorf("get block count: %w", err)
	}
	s.height = count
	return nil
}

// SetHeight overrides the scanner's current height. This is used for replay
// support — when restarting from a persisted state, call this before Run().
func (s *Scanner) SetHeight(height int64) {
	s.height = height
}

// processNewBlocks fetches any new blocks and publishes block.connected events.
// It detects reorgs by checking the previous hash of each new block against
// the expected chain.
func (s *Scanner) processNewBlocks(ctx context.Context) error {
	count, err := s.flo.GetBlockCount(ctx)
	if err != nil {
		return fmt.Errorf("get block count: %w", err)
	}

	for h := s.height + 1; h <= count; h++ {
		hash, err := s.flo.GetBlockHash(ctx, h)
		if err != nil {
			return fmt.Errorf("get block hash at %d: %w", h, err)
		}

		// Detect reorgs at the next height
		if h == s.height+1 && s.height > 0 {
			forkHeight, err := s.detectReorg(ctx, hash, h)
			if err != nil {
				return fmt.Errorf("detect reorg at %d: %w", h, err)
			}
			if forkHeight > 0 {
				if err := s.handleReorg(ctx, forkHeight); err != nil {
					return fmt.Errorf("handle reorg: %w", err)
				}
				// Continue to replay new blocks from fork height
				h = s.height + 1
				continue
			}
		}

		block, err := s.flo.GetBlock(ctx, hash)
		if err != nil {
			return fmt.Errorf("get block %s: %w", hash, err)
		}

		event := convertBlock(block)

		data, err := json.Marshal(event)
		if err != nil {
			return fmt.Errorf("marshal block.connected: %w", err)
		}

		if err := s.bus.Publish(ctx, eventbus.SubjectBlockConnected, data); err != nil {
			return fmt.Errorf("publish block.connected: %w", err)
		}

		s.height = h
	}

	return nil
}

// syncMempool diffs the current mempool against the previous snapshot and
// publishes added/removed events.
func (s *Scanner) syncMempool(ctx context.Context) error {
	txids, err := s.flo.GetRawMempool(ctx)
	if err != nil {
		return fmt.Errorf("get raw mempool: %w", err)
	}

	current := make(map[string]struct{}, len(txids))
	for _, txid := range txids {
		current[txid] = struct{}{}
	}

	// Detect removed
	for txid := range s.mempool {
		if _, ok := current[txid]; !ok {
			event := models.TxMempoolRemoved{TxID: txid}
			data, _ := json.Marshal(event)
			s.bus.Publish(ctx, eventbus.SubjectTxMempoolRemoved, data)
		}
	}

	// Detect added — fetch fee info for new mempool entries
	for txid := range current {
		if _, ok := s.mempool[txid]; !ok {
			// Get detailed tx info to include fee, size, etc.
			tx, err := s.flo.GetRawTransaction(ctx, txid)
			event := models.TxMempoolAdded{TxID: txid, Time: time.Now().Unix(), Size: 0, VSize: 0, Fee: 0}
			if err == nil && tx != nil {
				event.Size = tx.Size
				event.VSize = tx.VSize
			}
			data, _ := json.Marshal(event)
			s.bus.Publish(ctx, eventbus.SubjectTxMempoolAdded, data)
		}
	}

	s.mempool = current
	return nil
}

// convertBlock converts a flo.Block to a models.BlockConnected event.
func convertBlock(block *flo.Block) models.BlockConnected {
	event := models.BlockConnected{
		Hash:       block.Hash,
		Height:     block.Height,
		Time:       block.Time,
		Size:       block.Size,
		Weight:     block.Weight,
		Version:    block.Version,
		MerkleRoot: block.MerkleRoot,
		Bits:       block.Bits,
		Nonce:      block.Nonce,
		Difficulty: block.Difficulty,
		Chainwork:  block.Chainwork,
		PrevHash:   block.PreviousBlockHash,
		TxCount:    0,
	}

	event.Transactions = extractBlockTxs(block)
	event.TxCount = int64(len(event.Transactions))
	return event
}

// extractBlockTxs unmarshals the raw Tx field from the FLO RPC response
// into flo.Transaction objects, then converts them to models.Transaction.
func extractBlockTxs(block *flo.Block) []models.Transaction {
	if len(block.Tx) == 0 {
		return nil
	}

	var floTxs []flo.Transaction
	if err := json.Unmarshal(block.Tx, &floTxs); err != nil {
		return nil
	}

	txs := make([]models.Transaction, 0, len(floTxs))
	for _, ftx := range floTxs {
		mtx := models.Transaction{
			TxID:  ftx.TxID,
			Hash:  ftx.Hash,
			Size:  ftx.Size,
			VSize: ftx.VSize,
		}

		for _, fvin := range ftx.Vin {
			mvin := models.Vin{
				Coinbase: fvin.Coinbase,
				TxID:     fvin.TxID,
				Vout:     fvin.Vout,
				Sequence: fvin.Sequence,
			}
			if fvin.ScriptSig != nil {
				mvin.ScriptSig = fvin.ScriptSig.Hex
			}
			mtx.Vin = append(mtx.Vin, mvin)
		}

		for _, fvout := range ftx.Vout {
			mvout := models.Vout{
				Value: int64(fvout.Value * 1e8),
				N:     fvout.N,
			}
			mvout.ScriptPubKeyHex = fvout.ScriptPubKey.Hex
			mvout.ScriptPubKeyType = fvout.ScriptPubKey.Type
			mvout.Addresses = fvout.ScriptPubKey.Addresses
			mtx.Vout = append(mtx.Vout, mvout)
		}

		txs = append(txs, mtx)
	}

	return txs
}
