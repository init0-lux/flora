-- name: GetMempool :many
SELECT * FROM mempool ORDER BY time DESC;

-- name: GetMempoolTx :one
SELECT * FROM mempool WHERE txid = $1;

-- name: InsertMempoolTx :exec
INSERT INTO mempool (txid, time, size, vsize, fee, fee_per_byte)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (txid) DO UPDATE SET
    time         = EXCLUDED.time,
    size         = EXCLUDED.size,
    vsize        = EXCLUDED.vsize,
    fee          = EXCLUDED.fee,
    fee_per_byte = EXCLUDED.fee_per_byte;

-- name: DeleteMempoolTx :exec
DELETE FROM mempool WHERE txid = $1;

-- name: DeleteAllMempool :exec
DELETE FROM mempool;
