package flo

import (
	"context"
	"encoding/json"
)

// GetBestBlockHash returns the hash of the best (tip) block.
func (c *Client) GetBestBlockHash(ctx context.Context) (string, error) {
	raw, err := c.call(ctx, "getbestblockhash", nil)
	if err != nil {
		return "", err
	}
	var hash string
	if err := json.Unmarshal(raw, &hash); err != nil {
		return "", err
	}
	return hash, nil
}

// GetBlockCount returns the number of blocks in the best chain.
func (c *Client) GetBlockCount(ctx context.Context) (int64, error) {
	raw, err := c.call(ctx, "getblockcount", nil)
	if err != nil {
		return 0, err
	}
	var count int64
	if err := json.Unmarshal(raw, &count); err != nil {
		return 0, err
	}
	return count, nil
}

// GetBlockHash returns the hash of the block at the given height.
func (c *Client) GetBlockHash(ctx context.Context, height int64) (string, error) {
	raw, err := c.call(ctx, "getblockhash", []any{height})
	if err != nil {
		return "", err
	}
	var hash string
	if err := json.Unmarshal(raw, &hash); err != nil {
		return "", err
	}
	return hash, nil
}

// GetBlock returns block data for the given block hash with verbose transaction details.
func (c *Client) GetBlock(ctx context.Context, hash string) (*Block, error) {
	raw, err := c.call(ctx, "getblock", []any{hash, 2})
	if err != nil {
		return nil, err
	}
	var block Block
	if err := json.Unmarshal(raw, &block); err != nil {
		return nil, err
	}
	return &block, nil
}

// GetBlockVerbose returns block data with only transaction hashes (verbose=1).
func (c *Client) GetBlockVerbose(ctx context.Context, hash string) (*Block, error) {
	raw, err := c.call(ctx, "getblock", []any{hash, 1})
	if err != nil {
		return nil, err
	}
	var block Block
	if err := json.Unmarshal(raw, &block); err != nil {
		return nil, err
	}
	return &block, nil
}

// GetRawTransaction returns verbose transaction details for the given txid.
func (c *Client) GetRawTransaction(ctx context.Context, txid string) (*Transaction, error) {
	raw, err := c.call(ctx, "getrawtransaction", []any{txid, true})
	if err != nil {
		return nil, err
	}
	var tx Transaction
	if err := json.Unmarshal(raw, &tx); err != nil {
		return nil, err
	}
	return &tx, nil
}

// GetRawMempool returns the list of transaction IDs in the mempool.
func (c *Client) GetRawMempool(ctx context.Context) ([]string, error) {
	raw, err := c.call(ctx, "getrawmempool", nil)
	if err != nil {
		return nil, err
	}
	var txids []string
	if err := json.Unmarshal(raw, &txids); err != nil {
		return nil, err
	}
	return txids, nil
}

// GetBlockchainInfo returns blockchain state information.
func (c *Client) GetBlockchainInfo(ctx context.Context) (*BlockchainInfo, error) {
	raw, err := c.call(ctx, "getblockchaininfo", nil)
	if err != nil {
		return nil, err
	}
	var info BlockchainInfo
	if err := json.Unmarshal(raw, &info); err != nil {
		return nil, err
	}
	return &info, nil
}

// GetNetworkInfo returns network state information.
func (c *Client) GetNetworkInfo(ctx context.Context) (*NetworkInfo, error) {
	raw, err := c.call(ctx, "getnetworkinfo", nil)
	if err != nil {
		return nil, err
	}
	var info NetworkInfo
	if err := json.Unmarshal(raw, &info); err != nil {
		return nil, err
	}
	return &info, nil
}
