package indexer

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/init0/flora/packages/eventbus"
	"github.com/init0/flora/packages/models"
)

// detectReorg checks whether the chain at the given hash matches the expected
// previous hash. Returns the fork height if a reorg is detected, or 0 if not.
func (s *Scanner) detectReorg(ctx context.Context, hash string, height int64) (int64, error) {
	block, err := s.flo.GetBlock(ctx, hash)
	if err != nil {
		return 0, fmt.Errorf("get block %s: %w", hash, err)
	}

	// Walk backwards to find the fork point by comparing against our stored state.
	// If the block at (height - 1) has a different hash than our previous block,
	// we have a reorg.
	if height <= 1 {
		return 0, nil
	}

	expectedPrev, err := s.flo.GetBlockHash(ctx, height-1)
	if err != nil {
		return 0, fmt.Errorf("get block hash at %d: %w", height-1, err)
	}

	if block.PreviousBlockHash != expectedPrev {
		return height - 1, nil
	}

	return 0, nil
}

// handleReorg publishes block.disconnected events from the current tip down to
// the fork height, then returns the fork height so processNewBlocks can replay.
func (s *Scanner) handleReorg(ctx context.Context, forkHeight int64) error {
	for h := s.height; h > forkHeight; h-- {
		hash, err := s.flo.GetBlockHash(ctx, h)
		if err != nil {
			return fmt.Errorf("get block hash at %d during reorg: %w", h, err)
		}

		block, err := s.flo.GetBlock(ctx, hash)
		if err != nil {
			return fmt.Errorf("get block %s during reorg: %w", hash, err)
		}

		event := models.BlockDisconnected{
			Hash:   block.Hash,
			Height: block.Height,
			Time:   block.Time,
		}

		data, _ := json.Marshal(event)
		if err := s.bus.Publish(ctx, eventbus.SubjectBlockDisconnected, data); err != nil {
			return fmt.Errorf("publish block.disconnected: %w", err)
		}
	}

	s.height = forkHeight
	return nil
}
