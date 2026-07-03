-- +goose Up

-- Additional indexes for query performance
CREATE INDEX IF NOT EXISTS idx_address_txs_block_height ON address_txs (block_height DESC);
CREATE INDEX IF NOT EXISTS idx_vins_prev ON vins (prev_txid, prev_vout);
CREATE INDEX IF NOT EXISTS idx_vouts_value ON vouts (value);

-- +goose Down
DROP INDEX IF EXISTS idx_address_txs_block_height;
DROP INDEX IF EXISTS idx_vins_prev;
DROP INDEX IF EXISTS idx_vouts_value;
