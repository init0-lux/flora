-- name: GetVoutsByTxid :many
SELECT * FROM vouts WHERE txid = $1 ORDER BY n;

-- name: InsertVout :exec
INSERT INTO vouts (txid, n, value, script_pub_key_hex, script_pub_key_type, addresses)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: DeleteVoutsByTxid :exec
DELETE FROM vouts WHERE txid = $1;
