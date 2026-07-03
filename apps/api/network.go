package main

import (
	"context"

	"github.com/gofiber/fiber/v2"
)

// NetworkResponse aggregates chain, mempool, and peer info.
type NetworkResponse struct {
	ChainInfo  ChainInfoSummary `json:"chainInfo"`
	Mempool    MempoolSummary   `json:"mempool"`
	PeerCount  int64            `json:"peerCount"`
	BestBlock  string           `json:"bestBlock"`
	BestHeight int64            `json:"bestHeight"`
	Synced     bool             `json:"synced"`
}

type ChainInfoSummary struct {
	Chain         string  `json:"chain"`
	Blocks        int64   `json:"blocks"`
	Headers       int64   `json:"headers"`
	BestBlockHash string  `json:"bestBlockHash"`
	Difficulty    float64 `json:"difficulty"`
	Version       string  `json:"version"`
	SubVersion    string  `json:"subVersion"`
	Connections   int64   `json:"connections"`
}

type MempoolSummary struct {
	Size   int64  `json:"size"`
	Bytes  int64  `json:"bytes"`
	MinFee string `json:"minFee"`
}

func (h *handler) getNetwork(c *fiber.Ctx) error {
	ctx := context.Background()

	bcInfo, err := h.flo.GetBlockchainInfo(ctx)
	if err != nil {
		return c.Status(503).JSON(fiber.Map{"error": err.Error()})
	}

	netInfo, err := h.flo.GetNetworkInfo(ctx)
	if err != nil {
		netInfo = nil
	}

	mempoolTxs, _ := h.db.GetMempool(ctx)

	var totalBytes int64
	for _, m := range mempoolTxs {
		totalBytes += m.Size
	}

	conns := int64(0)
	subver := ""
	if netInfo != nil {
		conns = netInfo.Connections
		subver = netInfo.SubVersion
	}

	return c.JSON(NetworkResponse{
		ChainInfo: ChainInfoSummary{
			Chain:         bcInfo.Chain,
			Blocks:        bcInfo.Blocks,
			Headers:       bcInfo.Headers,
			BestBlockHash: bcInfo.BestBlockHash,
			Difficulty:    bcInfo.Difficulty,
			SubVersion:    subver,
			Connections:   conns,
		},
		Mempool: MempoolSummary{
			Size:  int64(len(mempoolTxs)),
			Bytes: totalBytes,
		},
		PeerCount:  conns,
		BestBlock:  bcInfo.BestBlockHash,
		BestHeight: bcInfo.Blocks,
		Synced:     bcInfo.Blocks == bcInfo.Headers,
	})
}

func (h *handler) getRecentTxs(c *fiber.Ctx) error {
	ctx := context.Background()
	limit := int32(c.QueryInt("limit", 25))
	if limit < 1 || limit > 100 {
		limit = 25
	}

	txs, err := h.db.GetRecentTransactions(ctx, limit)
	if err != nil || txs == nil {
		return c.JSON(fiber.Map{"items": []TransactionResponse{}})
	}

	height, _ := h.db.GetLatestBlockHeight(ctx)

	items := make([]TransactionResponse, 0, len(txs))
	for _, tx := range txs {
		items = append(items, TransactionResponse{
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
		})
	}

	return c.JSON(fiber.Map{
		"page":        1,
		"itemsOnPage": len(items),
		"items":       items,
	})
}

// formatAmount already defined in transactions.go
