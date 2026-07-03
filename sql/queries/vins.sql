-- name: GetVinsByTxid :many
SELECT * FROM vins WHERE txid = $1 ORDER BY id;

-- name: InsertVin :exec
INSERT INTO vins (txid, vout, coinbase, prev_txid, prev_vout, script_sig, sequence, txinwitness)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: DeleteVinsByTxid :exec
DELETE FROM vins WHERE txid = $1;
