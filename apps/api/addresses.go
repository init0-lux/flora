package main

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/init0/flora/packages/db/repository"
)

// AddressResponse mirrors the Blockbook address shape.
type AddressResponse struct {
	Address            string `json:"address"`
	Balance            string `json:"balance"`
	Received           string `json:"totalReceived"`
	Sent               string `json:"totalSent"`
	Txs                int64  `json:"txs"`
	UnconfirmedBalance string `json:"unconfirmedBalance"`
	UnconfirmedTxs     int64  `json:"unconfirmedTxs"`
}

func (h *handler) getAddress(c *fiber.Ctx) error {
	address := c.Params("address")
	if address == "" {
		return c.Status(400).JSON(fiber.Map{"error": "address is required"})
	}

	ctx := context.Background()
	bal, err := h.db.GetAddressBalance(ctx, address)
	if err != nil {
		return c.JSON(AddressResponse{
			Address:            address,
			Balance:            "0",
			Received:           "0",
			Sent:               "0",
			Txs:                0,
			UnconfirmedBalance: "0",
			UnconfirmedTxs:     0,
		})
	}

	return c.JSON(AddressResponse{
		Address:            address,
		Balance:            formatAmount(bal.Balance),
		Received:           formatAmount(bal.Received),
		Sent:               formatAmount(bal.Sent),
		Txs:                bal.Txs,
		UnconfirmedBalance: "0",
		UnconfirmedTxs:     0,
	})
}

func (h *handler) getAddressTxs(c *fiber.Ctx) error {
	address := c.Params("address")
	if address == "" {
		return c.Status(400).JSON(fiber.Map{"error": "address is required"})
	}

	page, limit := parsePagination(c)
	offset := (page - 1) * limit

	ctx := context.Background()

	totalCount, _ := h.db.GetAddressTxCount(ctx, address)
	totalPages := int(totalCount) / limit
	if int(totalCount)%limit > 0 {
		totalPages++
	}

	items, err := h.db.GetAddressTxs(ctx, repository.GetAddressTxsParams{
		Address: address,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil || items == nil {
		return c.JSON(fiber.Map{
			"page": page, "totalPages": 1, "itemsOnPage": 0, "items": []TransactionResponse{},
		})
	}

	height, _ := h.db.GetLatestBlockHeight(ctx)

	txItems := make([]TransactionResponse, 0, len(items))
	for _, item := range items {
		txItems = append(txItems, TransactionResponse{
			TxID:          item.Txid,
			Hash:          item.Hash,
			Size:          item.Size,
			VSize:         item.Vsize,
			BlockHash:     item.BlockHash,
			BlockHeight:   item.BlockHeight,
			BlockTime:     item.BlockTime,
			Confirmations: height - item.BlockHeight + 1,
			Coinbase:      item.Coinbase,
		})
	}

	return c.JSON(fiber.Map{
			"page": page, "totalPages": totalPages, "itemsOnPage": len(txItems), "items": txItems,
		})
}
