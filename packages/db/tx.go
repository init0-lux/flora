package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/init0/flora/packages/db/repository"
)

// WithTx executes a function within a database transaction. If the function
// returns an error, the transaction is rolled back. Otherwise it is committed.
func WithTx(ctx context.Context, pool *pgxpool.Pool, fn func(*repository.Queries) error) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	q := repository.New(tx)
	if err := fn(q); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// Querier returns a repository.Queries using the pool directly (no transaction).
func Querier(pool *pgxpool.Pool) *repository.Queries {
	return repository.New(pool)
}
