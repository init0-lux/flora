//go:build integration

package flo

import (
	"context"
	"os"
	"testing"
)

func getEnvOrSkip(t *testing.T) (url, user, pass string) {
	t.Helper()
	url = os.Getenv("FLO_RPC_URL")
	user = os.Getenv("FLO_RPC_USER")
	pass = os.Getenv("FLO_RPC_PASS")
	if url == "" || user == "" || pass == "" {
		t.Skip("Skipping integration test: set FLO_RPC_URL, FLO_RPC_USER, and FLO_RPC_PASS")
	}
	return
}

func TestIntegration_Ping(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)
	if err := client.Ping(context.Background()); err != nil {
		t.Fatalf("Ping: %v", err)
	}
}

func TestIntegration_GetBlockchainInfo(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)

	info, err := client.GetBlockchainInfo(context.Background())
	if err != nil {
		t.Fatalf("GetBlockchainInfo: %v", err)
	}
	if info.Chain == "" {
		t.Fatal("Chain is empty")
	}
	if info.Blocks <= 0 {
		t.Errorf("Blocks = %d, want > 0", info.Blocks)
	}
	if info.BestBlockHash == "" {
		t.Fatal("BestBlockHash is empty")
	}
	t.Logf("chain=%s blocks=%d bestblockhash=%s", info.Chain, info.Blocks, info.BestBlockHash)
}

func TestIntegration_GetBlockCount(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)

	count, err := client.GetBlockCount(context.Background())
	if err != nil {
		t.Fatalf("GetBlockCount: %v", err)
	}
	if count <= 0 {
		t.Errorf("BlockCount = %d, want > 0", count)
	}
	t.Logf("block count = %d", count)
}

func TestIntegration_BestBlockHashConsistency(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)
	ctx := context.Background()

	bestHash, err := client.GetBestBlockHash(ctx)
	if err != nil {
		t.Fatalf("GetBestBlockHash: %v", err)
	}
	if bestHash == "" {
		t.Fatal("BestBlockHash is empty")
	}

	info, err := client.GetBlockchainInfo(ctx)
	if err != nil {
		t.Fatalf("GetBlockchainInfo: %v", err)
	}
	if bestHash != info.BestBlockHash {
		t.Errorf("BestBlockHash mismatch: getbestblockhash=%q, getblockchaininfo=%q", bestHash, info.BestBlockHash)
	}
}

func TestIntegration_GetBlockByHash(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)
	ctx := context.Background()

	bestHash, err := client.GetBestBlockHash(ctx)
	if err != nil {
		t.Fatalf("GetBestBlockHash: %v", err)
	}

	block, err := client.GetBlock(ctx, bestHash)
	if err != nil {
		t.Fatalf("GetBlock(%q): %v", bestHash, err)
	}
	if block.Hash != bestHash {
		t.Errorf("Hash = %q, want %q", block.Hash, bestHash)
	}
	if block.Height <= 0 {
		t.Errorf("Height = %d, want > 0", block.Height)
	}
	if block.Confirmations < 1 {
		t.Errorf("Confirmations = %d, want >= 1", block.Confirmations)
	}
	if block.Time <= 0 {
		t.Errorf("Time = %d, want > 0", block.Time)
	}
	t.Logf("height=%d hash=%s txs=%d", block.Height, block.Hash, len(block.Tx))
}

func TestIntegration_GetBlockByHeight(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)
	ctx := context.Background()

	count, err := client.GetBlockCount(ctx)
	if err != nil {
		t.Fatalf("GetBlockCount: %v", err)
	}

	hash, err := client.GetBlockHash(ctx, count)
	if err != nil {
		t.Fatalf("GetBlockHash(%d): %v", count, err)
	}
	if hash == "" {
		t.Fatal("BlockHash is empty")
	}

	bestHash, err := client.GetBestBlockHash(ctx)
	if err != nil {
		t.Fatalf("GetBestBlockHash: %v", err)
	}
	if hash != bestHash {
		t.Errorf("BlockHash at height %d = %q, but BestBlockHash = %q", count, hash, bestHash)
	}
}

func TestIntegration_GetRawMempool(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)

	txids, err := client.GetRawMempool(context.Background())
	if err != nil {
		t.Fatalf("GetRawMempool: %v", err)
	}
	t.Logf("mempool size = %d", len(txids))
}

func TestIntegration_GetNetworkInfo(t *testing.T) {
	url, user, pass := getEnvOrSkip(t)
	client := New(url, user, pass)

	info, err := client.GetNetworkInfo(context.Background())
	if err != nil {
		t.Fatalf("GetNetworkInfo: %v", err)
	}
	if info.SubVersion == "" {
		t.Fatal("SubVersion is empty")
	}
	if info.Connections < 0 {
		t.Errorf("Connections = %d, want >= 0", info.Connections)
	}
	t.Logf("version=%d subversion=%s connections=%d", info.Version, info.SubVersion, info.Connections)
}
