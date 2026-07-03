package main

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

// TransactionResponse mirrors the Blockbook tx detail shape.
type TransactionResponse struct {
	TxID          string         `json:"txid"`
	Hash          string         `json:"hash"`
	Size          int64          `json:"size"`
	VSize         int64          `json:"vsize"`
	Version       int64          `json:"version"`
	LockTime      int64          `json:"locktime"`
	BlockHash     string         `json:"blockHash"`
	BlockHeight   int64          `json:"blockHeight"`
	BlockTime     int64          `json:"blockTime"`
	Confirmations int64          `json:"confirmations"`
	Coinbase      bool           `json:"coinbase"`
	Vin           []VinResponse  `json:"vin"`
	Vout          []VoutResponse `json:"vout"`
}

type VinResponse struct {
	Coinbase  string `json:"coinbase,omitempty"`
	TxID      string `json:"txid,omitempty"`
	Vout      int64  `json:"vout,omitempty"`
	ScriptSig string `json:"scriptSig,omitempty"`
	Sequence  int64  `json:"sequence"`
}

type VoutResponse struct {
	Value            string   `json:"value"`
	N                int64    `json:"n"`
	ScriptPubKeyHex  string   `json:"scriptPubKeyHex,omitempty"`
	ScriptPubKeyType string   `json:"scriptPubKeyType,omitempty"`
	Addresses        []string `json:"addresses,omitempty"`
}

func (h *handler) getTx(c *fiber.Ctx) error {
	txid := c.Params("txid")
	if txid == "" {
		return c.Status(400).JSON(fiber.Map{"error": "txid is required"})
	}

	ctx := context.Background()

	tx, err := h.db.GetTxByTxid(ctx, txid)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": fmt.Sprintf("transaction not found: %s", txid)})
	}

	vins, err := h.db.GetVinsByTxid(ctx, txid)
	if err != nil {
		vins = nil
	}

	vouts, err := h.db.GetVoutsByTxid(ctx, txid)
	if err != nil {
		vouts = nil
	}

	height, err := h.db.GetLatestBlockHeight(ctx)
	if err != nil {
		height = 0
	}

	vinResp := make([]VinResponse, 0, len(vins))
	for _, v := range vins {
		vr := VinResponse{
			Coinbase:  v.Coinbase,
			TxID:      v.PrevTxid,
			Vout:      v.PrevVout,
			ScriptSig: v.ScriptSig,
			Sequence:  v.Sequence,
		}
		if vr.Coinbase == "" {
			vr.Coinbase = v.Coinbase
		}
		vinResp = append(vinResp, vr)
	}

	voutResp := make([]VoutResponse, 0, len(vouts))
	for _, v := range vouts {
		voutResp = append(voutResp, VoutResponse{
			Value:            formatAmount(v.Value),
			N:                v.N,
			ScriptPubKeyHex:  v.ScriptPubKeyHex,
			ScriptPubKeyType: v.ScriptPubKeyType,
			Addresses:        v.Addresses,
		})
	}

	return c.JSON(TransactionResponse{
		TxID:          tx.Txid,
		Hash:          tx.Hash,
		Size:          tx.Size,
		VSize:         tx.Vsize,
		Version:       tx.Version,
		LockTime:      tx.Locktime,
		BlockHash:     tx.BlockHash,
		BlockHeight:   tx.BlockHeight,
		BlockTime:     tx.BlockTime,
		Confirmations: height - tx.BlockHeight + 1,
		Coinbase:      tx.Coinbase,
		Vin:           vinResp,
		Vout:          voutResp,
	})
}

func (h *handler) getBlockTxs(c *fiber.Ctx) error {
	hash := c.Params("hash")
	if hash == "" {
		return c.Status(400).JSON(fiber.Map{"error": "hash is required"})
	}

	ctx := context.Background()
	txs, err := h.db.GetTxsByBlockHash(ctx, hash)
	if err != nil || txs == nil {
		return c.JSON(fiber.Map{"page": 1, "totalPages": 1, "itemsOnPage": 0, "items": []TransactionResponse{}})
	}

	height, _ := h.db.GetLatestBlockHeight(ctx)

	items := make([]TransactionResponse, 0, len(txs))
	for _, tx := range txs {
		items = append(items, TransactionResponse{
			TxID:          tx.Txid,
			Hash:          tx.Hash,
			Size:          tx.Size,
			VSize:         tx.Vsize,
			BlockHash:     tx.BlockHash,
			BlockHeight:   tx.BlockHeight,
			BlockTime:     tx.BlockTime,
			Confirmations: height - tx.BlockHeight + 1,
			Coinbase:      tx.Coinbase,
		})
	}

	return c.JSON(fiber.Map{
		"page":        1,
		"totalPages":  1,
		"itemsOnPage": len(items),
		"items":       items,
	})
}

func formatAmount(sat int64) string {
	whole := sat / 1e8
	frac := sat % 1e8
	return fmt.Sprintf("%d.%08d", whole, frac)
}
