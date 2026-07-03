package main

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

// MempoolResponse represents the mempool overview.
type MempoolResponse struct {
	Txs      int64  `json:"txs"`
	Size     int64  `json:"size"`
	TotalFee string `json:"totalFee"`
}

// MempoolTxResponse represents a single mempool transaction.
type MempoolTxResponse struct {
	TxID       string `json:"txid"`
	Time       int64  `json:"time"`
	Size       int64  `json:"size"`
	Fee        string `json:"fee"`
	FeePerByte string `json:"feePerByte"`
}

func (h *handler) getMempool(c *fiber.Ctx) error {
	ctx := context.Background()
	items, err := h.db.GetMempool(ctx)
	if err != nil || items == nil {
		return c.JSON(fiber.Map{
			"page": 1, "totalPages": 1, "itemsOnPage": 0, "items": []MempoolTxResponse{},
		})
	}

	txItems := make([]MempoolTxResponse, 0, len(items))
	for _, m := range items {
		txItems = append(txItems, MempoolTxResponse{
			TxID:       m.Txid,
			Time:       m.Time,
			Size:       m.Size,
			Fee:        formatAmount(m.Fee),
			FeePerByte: formatAmount(m.FeePerByte),
		})
	}

	return c.JSON(fiber.Map{
		"page": 1, "totalPages": 1, "itemsOnPage": len(txItems), "items": txItems,
	})
}

func (h *handler) getMempoolTx(c *fiber.Ctx) error {
	txid := c.Params("txid")
	if txid == "" {
		return c.Status(400).JSON(fiber.Map{"error": "txid is required"})
	}

	ctx := context.Background()
	m, err := h.db.GetMempoolTx(ctx, txid)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": fmt.Sprintf("transaction not in mempool: %s", txid)})
	}

	return c.JSON(MempoolTxResponse{
		TxID:       m.Txid,
		Time:       m.Time,
		Size:       m.Size,
		Fee:        formatAmount(m.Fee),
		FeePerByte: formatAmount(m.FeePerByte),
	})
}
