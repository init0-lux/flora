-- +goose Up

-- ── Blocks ──────────────────────────────────────────────────────────────
CREATE TABLE blocks (
    hash         TEXT   PRIMARY KEY,
    height       BIGINT NOT NULL UNIQUE,
    prev_hash    TEXT   NOT NULL DEFAULT '',
    merkle_root  TEXT   NOT NULL DEFAULT '',
    time         BIGINT NOT NULL DEFAULT 0,
    bits         TEXT   NOT NULL DEFAULT '',
    nonce        BIGINT NOT NULL DEFAULT 0,
    size         BIGINT NOT NULL DEFAULT 0,
    weight       BIGINT NOT NULL DEFAULT 0,
    version      BIGINT NOT NULL DEFAULT 0,
    difficulty   DOUBLE PRECISION NOT NULL DEFAULT 0,
    chainwork    TEXT   NOT NULL DEFAULT '',
    tx_count     BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blocks_height ON blocks (height DESC);

-- ── Transactions ────────────────────────────────────────────────────────
CREATE TABLE transactions (
    txid         TEXT   PRIMARY KEY,
    hash         TEXT   NOT NULL DEFAULT '',
    block_hash   TEXT   NOT NULL REFERENCES blocks(hash) ON DELETE CASCADE,
    block_height BIGINT NOT NULL DEFAULT 0,
    block_time   BIGINT NOT NULL DEFAULT 0,
    size         BIGINT NOT NULL DEFAULT 0,
    vsize        BIGINT NOT NULL DEFAULT 0,
    version      BIGINT NOT NULL DEFAULT 0,
    locktime     BIGINT NOT NULL DEFAULT 0,
    coinbase     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_block_hash ON transactions (block_hash);
CREATE INDEX idx_transactions_block_height ON transactions (block_height DESC);

-- ── Transaction Inputs ──────────────────────────────────────────────────
CREATE TABLE vins (
    id           BIGSERIAL PRIMARY KEY,
    txid         TEXT   NOT NULL REFERENCES transactions(txid) ON DELETE CASCADE,
    vout         BIGINT NOT NULL DEFAULT -1,
    coinbase     TEXT   NOT NULL DEFAULT '',
    prev_txid    TEXT   NOT NULL DEFAULT '',
    prev_vout    BIGINT NOT NULL DEFAULT -1,
    script_sig   TEXT   NOT NULL DEFAULT '',
    sequence     BIGINT NOT NULL DEFAULT 0,
    txinwitness  TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_vins_txid ON vins (txid);
CREATE INDEX idx_vins_prev_txid ON vins (prev_txid);

-- ── Transaction Outputs ─────────────────────────────────────────────────
CREATE TABLE vouts (
    id               BIGSERIAL PRIMARY KEY,
    txid             TEXT   NOT NULL REFERENCES transactions(txid) ON DELETE CASCADE,
    n                BIGINT NOT NULL DEFAULT 0,
    value            BIGINT NOT NULL DEFAULT 0,
    script_pub_key_hex TEXT   NOT NULL DEFAULT '',
    script_pub_key_type TEXT NOT NULL DEFAULT '',
    addresses        TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_vouts_txid ON vouts (txid);
CREATE INDEX idx_vouts_addresses ON vouts USING GIN (addresses);
CREATE UNIQUE INDEX idx_vouts_txid_n ON vouts (txid, n);

-- ── Address Balances ────────────────────────────────────────────────────
CREATE TABLE address_balance (
    address    TEXT   PRIMARY KEY,
    balance    BIGINT NOT NULL DEFAULT 0,
    received   BIGINT NOT NULL DEFAULT 0,
    sent       BIGINT NOT NULL DEFAULT 0,
    txs        BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Address Transaction Index ──────────────────────────────────────────
CREATE TABLE address_txs (
    address      TEXT   NOT NULL,
    txid         TEXT   NOT NULL,
    block_height BIGINT NOT NULL DEFAULT 0,
    block_time   BIGINT NOT NULL DEFAULT 0,
    tx_type      TEXT   NOT NULL DEFAULT 'both',
    PRIMARY KEY (address, txid)
);

CREATE INDEX idx_address_txs_address_height ON address_txs (address, block_height DESC);
CREATE INDEX idx_address_txs_txid ON address_txs (txid);

-- ── UTXOs ───────────────────────────────────────────────────────────────
CREATE TABLE utxos (
    txid              TEXT   NOT NULL,
    vout              BIGINT NOT NULL,
    address           TEXT   NOT NULL DEFAULT '',
    value             BIGINT NOT NULL DEFAULT 0,
    script_pub_key_hex TEXT   NOT NULL DEFAULT '',
    coinbase          BOOLEAN NOT NULL DEFAULT FALSE,
    block_height      BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (txid, vout)
);

CREATE INDEX idx_utxos_address ON utxos (address);

-- ── Mempool ─────────────────────────────────────────────────────────────
CREATE TABLE mempool (
    txid         TEXT   PRIMARY KEY,
    time         BIGINT NOT NULL DEFAULT 0,
    size         BIGINT NOT NULL DEFAULT 0,
    vsize        BIGINT NOT NULL DEFAULT 0,
    fee          BIGINT NOT NULL DEFAULT 0,
    fee_per_byte BIGINT NOT NULL DEFAULT 0
);

-- ── Chain State ─────────────────────────────────────────────────────────
CREATE TABLE chain_state (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

-- +goose Down
DROP TABLE IF EXISTS chain_state CASCADE;
DROP TABLE IF EXISTS mempool CASCADE;
DROP TABLE IF EXISTS utxos CASCADE;
DROP TABLE IF EXISTS address_txs CASCADE;
DROP TABLE IF EXISTS address_balance CASCADE;
DROP TABLE IF EXISTS vouts CASCADE;
DROP TABLE IF EXISTS vins CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
