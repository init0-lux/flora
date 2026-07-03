package main

import (
	"context"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/init0/flora/packages/db/repository"
)

// BlockResponse mirrors the Blockbook block detail shape.
type BlockResponse struct {
	Hash              string `json:"hash"`
	Height            int64  `json:"height"`
	Time              int64  `json:"time"`
	Size              int64  `json:"size"`
	Weight            int64  `json:"weight"`
	Version           int64  `json:"version"`
	MerkleRoot        string `json:"merkleRoot"`
	Bits              string `json:"bits"`
	Nonce             int64  `json:"nonce"`
	Difficulty        string `json:"difficulty"`
	Chainwork         string `json:"chainwork"`
	PreviousBlockHash string `json:"previousBlockHash"`
	NextBlockHash     string `json:"nextBlockHash,omitempty"`
	TxCount           int64  `json:"txCount"`
	Confirmations     int64  `json:"confirmations"`
}

func fmtDifficulty(d float64) string {
	return strconv.FormatFloat(d, 'f', -1, 64)
}

func (h *handler) getBlockByHash(c *fiber.Ctx) error {
	hash := c.Params("hash")
	if hash == "" {
		return c.Status(400).JSON(fiber.Map{"error": "hash is required"})
	}

	block, err := h.db.GetBlockByHash(context.Background(), hash)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": fmt.Sprintf("block not found: %s", hash)})
	}

	return c.JSON(toBlockResponse(block, 0))
}

func (h *handler) getBlockByHeight(c *fiber.Ctx) error {
	heightStr := c.Params("height")
	height, err := strconv.ParseInt(heightStr, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid height"})
	}

	block, err := h.db.GetBlockByHeight(context.Background(), height)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": fmt.Sprintf("block not found at height %d", height)})
	}

	return c.JSON(toBlockResponse(block, 0))
}

func (h *handler) getBlocks(c *fiber.Ctx) error {
	page, limit := parsePagination(c)
	offset := (page - 1) * limit

	height, err := h.db.GetLatestBlockHeight(context.Background())
	if err != nil {
		height = 0
	}

	blocks, err := h.db.GetLatestBlocks(context.Background(), repository.GetLatestBlocksParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	items := make([]*BlockResponse, 0, len(blocks))
	for _, b := range blocks {
		items = append(items, toBlockResponse(b, height))
	}

	return c.JSON(fiber.Map{
		"page":        page,
		"totalPages":  1,
		"itemsOnPage": len(items),
		"items":       items,
	})
}

func toBlockResponse(row repository.Block, tipHeight int64) *BlockResponse {
	return &BlockResponse{
		Hash:              row.Hash,
		Height:            row.Height,
		Time:              row.Time,
		Size:              row.Size,
		Weight:            row.Weight,
		Version:           row.Version,
		MerkleRoot:        row.MerkleRoot,
		Bits:              row.Bits,
		Nonce:             row.Nonce,
		Difficulty:        fmtDifficulty(row.Difficulty),
		Chainwork:         row.Chainwork,
		PreviousBlockHash: row.PrevHash,
		TxCount:           row.TxCount,
		Confirmations:     tipHeight - row.Height + 1,
	}
}

func parsePagination(c *fiber.Ctx) (page int, limit int) {
	page = c.QueryInt("page", 1)
	limit = c.QueryInt("limit", 25)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 25
	}
	return
}
