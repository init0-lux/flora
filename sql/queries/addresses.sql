-- name: GetAddressBalance :one
SELECT * FROM address_balance WHERE address = $1;

-- name: UpsertAddressBalance :exec
INSERT INTO address_balance (address, balance, received, sent, txs, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW())
ON CONFLICT (address) DO UPDATE SET
    balance    = EXCLUDED.balance,
    received   = EXCLUDED.received,
    sent       = EXCLUDED.sent,
    txs        = EXCLUDED.txs,
    updated_at = NOW();

-- name: IncrementAddressBalance :exec
INSERT INTO address_balance (address, balance, received, sent, txs, updated_at)
VALUES ($1, $2, $3, $4, 1, NOW())
ON CONFLICT (address) DO UPDATE SET
    balance    = address_balance.balance + EXCLUDED.balance,
    received   = address_balance.received + EXCLUDED.received,
    sent       = address_balance.sent + EXCLUDED.sent,
    txs        = address_balance.txs + 1,
    updated_at = NOW();

-- name: GetAddressTxs :many
SELECT t.txid, t.hash, t.block_hash, t.block_height, t.block_time, t.size, t.vsize, t.version, t.locktime, t.coinbase
FROM address_txs a
JOIN transactions t ON t.txid = a.txid
WHERE a.address = $1
ORDER BY a.block_height DESC
LIMIT $2 OFFSET $3;

-- name: InsertAddressTx :exec
INSERT INTO address_txs (address, txid, block_height, block_time, tx_type)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (address, txid) DO NOTHING;

-- name: DeleteAddressTxsByTxid :exec
DELETE FROM address_txs WHERE txid = $1;
