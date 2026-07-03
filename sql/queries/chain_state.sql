-- name: GetChainState :one
SELECT * FROM chain_state WHERE key = $1;

-- name: SetChainState :exec
INSERT INTO chain_state (key, value)
VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
