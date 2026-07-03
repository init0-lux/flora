-- name: GetTxByTxid :one
SELECT * FROM transactions WHERE txid = $1;

-- name: GetTxsByBlockHash :many
SELECT * FROM transactions WHERE block_hash = $1 ORDER BY block_height DESC;

-- name: GetTxsByBlockHeight :many
SELECT * FROM transactions WHERE block_height = $1;

-- name: InsertTx :exec
INSERT INTO transactions (txid, hash, block_hash, block_height, block_time, size, vsize, version, locktime, coinbase)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: DeleteTx :exec
DELETE FROM transactions WHERE txid = $1;

-- name: DeleteTxsByBlockHash :exec
DELETE FROM transactions WHERE block_hash = $1;

-- name: GetRecentTransactions :many
SELECT * FROM transactions ORDER BY block_height DESC, txid LIMIT $1;
