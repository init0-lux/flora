package cache

import (
	"context"
	"errors"
	"time"
)

// key not present in cache
var ErrNotFound = errors.New("cache: key not found")

type Cache interface {
	Get(ctx context.Context, key string) ([]byte, error)

	// ttl = 0 => no expiration
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	Exists(ctx context.Context, key string) (bool, error)

	// Ping checks whether the cache backend is reachable.
	Ping(ctx context.Context) error

	// Close closes the cache backend, releasing any resources.
	Close() error
}
