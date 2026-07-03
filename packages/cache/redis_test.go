package cache

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func newTestRedisCache(t *testing.T) (*RedisCache, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.NewMiniRedis()
	if err := mr.Start(); err != nil {
		t.Fatalf("miniredis start: %v", err)
	}
	t.Cleanup(mr.Close)

	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { client.Close() })

	return NewRedisCacheWithClient(client), mr
}

func TestSetAndGet(t *testing.T) {
	c, _ := newTestRedisCache(t)
	ctx := context.Background()

	if err := c.Set(ctx, "key1", []byte("value1"), 0); err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	val, err := c.Get(ctx, "key1")
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if string(val) != "value1" {
		t.Errorf("got %q, want %q", string(val), "value1")
	}
}

func TestGet_missing(t *testing.T) {
	c, _ := newTestRedisCache(t)
	ctx := context.Background()

	_, err := c.Get(ctx, "nonexistent")
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestExists(t *testing.T) {
	c, _ := newTestRedisCache(t)
	ctx := context.Background()

	c.Set(ctx, "exists-key", []byte("val"), 0)

	ok, err := c.Exists(ctx, "exists-key")
	if err != nil {
		t.Fatalf("Exists failed: %v", err)
	}
	if !ok {
		t.Error("expected key to exist")
	}

	ok, err = c.Exists(ctx, "missing-key")
	if err != nil {
		t.Fatalf("Exists failed: %v", err)
	}
	if ok {
		t.Error("expected key to not exist")
	}
}

func TestDelete(t *testing.T) {
	c, _ := newTestRedisCache(t)
	ctx := context.Background()

	c.Set(ctx, "del-key", []byte("val"), 0)

	if err := c.Delete(ctx, "del-key"); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	_, err := c.Get(ctx, "del-key")
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound after delete, got %v", err)
	}
}

func TestTTL(t *testing.T) {
	c, mr := newTestRedisCache(t)
	ctx := context.Background()

	c.Set(ctx, "ttl-key", []byte("val"), 100*time.Millisecond)

	// miniredis fast-forwards past the TTL
	mr.FastForward(200 * time.Millisecond)

	_, err := c.Get(ctx, "ttl-key")
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound after TTL expiry, got %v", err)
	}
}

func TestPing(t *testing.T) {
	c, _ := newTestRedisCache(t)
	ctx := context.Background()

	if err := c.Ping(ctx); err != nil {
		t.Fatalf("Ping failed: %v", err)
	}
}
