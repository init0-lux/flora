-- name: GetBlockByHash :one
SELECT * FROM blocks WHERE hash = $1;

-- name: GetBlockByHeight :one
SELECT * FROM blocks WHERE height = $1;

-- name: GetLatestBlocks :many
SELECT * FROM blocks ORDER BY height DESC LIMIT $1 OFFSET $2;

-- name: InsertBlock :exec
INSERT INTO blocks (hash, height, prev_hash, merkle_root, time, bits, nonce, size, weight, version, difficulty, chainwork, tx_count)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);

-- name: DeleteBlock :exec
DELETE FROM blocks WHERE hash = $1;

-- name: GetBlockHeightByHash :one
SELECT height FROM blocks WHERE hash = $1;

-- name: GetBlockHashByHeight :one
SELECT hash FROM blocks WHERE height = $1;

-- name: GetBlockCount :one
SELECT COUNT(*)::bigint FROM blocks;

-- name: GetTransactionCount :one
SELECT COUNT(*)::bigint FROM transactions;

-- name: GetAddressTxCount :one
SELECT COUNT(*)::bigint FROM address_txs WHERE address = $1;

-- name: GetLatestBlockHeight :one
SELECT CAST(COALESCE(MAX(height), 0) AS BIGINT) FROM blocks;
