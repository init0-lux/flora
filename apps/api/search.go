package main

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
)

var (
	reBlockHash = regexp.MustCompile(`^[0-9a-fA-F]{64}$`)
	reTxid      = regexp.MustCompile(`^[0-9a-fA-F]{64}$`)
	reHeight    = regexp.MustCompile(`^\d+$`)
)

func (h *handler) search(c *fiber.Ctx) error {
	query := strings.TrimSpace(c.Params("query"))
	if query == "" {
		return c.Status(400).JSON(fiber.Map{"error": "query is required"})
	}

	ctx := context.Background()

	// Try block hash
	if reBlockHash.MatchString(query) {
		block, err := h.db.GetBlockByHash(ctx, query)
		if err == nil && block.Hash != "" {
			return c.JSON(fiber.Map{
				"type":   "block",
				"hash":   block.Hash,
				"height": block.Height,
			})
		}
	}

	tryTxid := func(q string) (string, bool) {
		if reTxid.MatchString(q) {
			tx, err := h.db.GetTxByTxid(ctx, q)
			if err == nil && tx.Txid != "" {
				return tx.Txid, true
			}
		}
		return "", false
	}
	if txid, ok := tryTxid(query); ok {
		return c.JSON(fiber.Map{"type": "transaction", "txid": txid})
	}

	// Try block height
	if reHeight.MatchString(query) {
		var blockHeight int64
		if _, err := fmt.Sscanf(query, "%d", &blockHeight); err == nil {
			blockHash, err := h.db.GetBlockHashByHeight(ctx, blockHeight)
			if err == nil && blockHash != "" {
				return c.JSON(fiber.Map{
					"type":   "block",
					"hash":   blockHash,
					"height": blockHeight,
				})
			}
		}
	}

	// Try address (FLO addresses)
	if strings.HasPrefix(query, "F") {
		bal, err := h.db.GetAddressBalance(ctx, query)
		if err == nil && bal.Address != "" {
			return c.JSON(fiber.Map{"type": "address", "address": query})
		}
	}

	return c.Status(404).JSON(fiber.Map{"error": "no results found"})
}
