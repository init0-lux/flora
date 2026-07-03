package main

import (
	"context"

	"github.com/gofiber/fiber/v2"
)

// UTXOResponse represents a single spendable output.
type UTXOResponse struct {
	TxID          string `json:"txid"`
	Vout          int64  `json:"vout"`
	Value         string `json:"value"`
	Height        int64  `json:"height"`
	Confirmations int64  `json:"confirmations"`
	Address       string `json:"address,omitempty"`
	ScriptHex     string `json:"scriptPubKeyHex,omitempty"`
	Coinbase      bool   `json:"coinbase"`
}

func (h *handler) getUtxos(c *fiber.Ctx) error {
	address := c.Params("address")
	if address == "" {
		return c.Status(400).JSON(fiber.Map{"error": "address is required"})
	}

	ctx := context.Background()
	utxos, err := h.db.GetUtxosByAddress(ctx, address)
	if err != nil || utxos == nil {
		return c.JSON([]UTXOResponse{})
	}

	height, _ := h.db.GetLatestBlockHeight(ctx)

	items := make([]UTXOResponse, 0, len(utxos))
	for _, u := range utxos {
		items = append(items, UTXOResponse{
			TxID:          u.Txid,
			Vout:          u.Vout,
			Value:         formatAmount(u.Value),
			Height:        u.BlockHeight,
			Confirmations: height - u.BlockHeight + 1,
			Address:       u.Address,
			ScriptHex:     u.ScriptPubKeyHex,
			Coinbase:      u.Coinbase,
		})
	}

	return c.JSON(items)
}
