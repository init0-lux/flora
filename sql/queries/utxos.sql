-- name: GetUtxosByAddress :many
SELECT * FROM utxos WHERE address = $1 ORDER BY block_height DESC, vout;

-- name: InsertUtxo :exec
INSERT INTO utxos (txid, vout, address, value, script_pub_key_hex, coinbase, block_height)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (txid, vout) DO NOTHING;

-- name: DeleteUtxo :exec
DELETE FROM utxos WHERE txid = $1 AND vout = $2;

-- name: DeleteUtxosByTxid :exec
DELETE FROM utxos WHERE txid = $1;

-- name: DeleteUtxosByAddress :exec
DELETE FROM utxos WHERE address = $1;
