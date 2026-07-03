package db

import (
	"context"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestNewPool_invalidURL(t *testing.T) {
	_, err := NewPool(context.Background(), "not-a-valid-db-url")
	if err == nil {
		t.Fatal("expected error for invalid URL, got nil")
	}
}

func TestParseConfig_valid(t *testing.T) {
	cfg, err := pgxpool.ParseConfig("postgres://flora:flora@localhost:5432/flora?sslmode=disable")
	if err != nil {
		t.Fatalf("ParseConfig failed: %v", err)
	}
	if cfg.ConnConfig.Host != "localhost" {
		t.Errorf("Host = %q, want %q", cfg.ConnConfig.Host, "localhost")
	}
	if cfg.ConnConfig.Database != "flora" {
		t.Errorf("Database = %q, want %q", cfg.ConnConfig.Database, "flora")
	}
}

func TestNewPool_pingWithoutConnection(t *testing.T) {
	// Using a URL pointing to a non-existent server to verify the ping fails.
	_, err := NewPool(context.Background(), "postgres://flora:flora@localhost:15432/flora?sslmode=disable&connect_timeout=1")
	if err == nil {
		t.Skip("unexpectedly connected to database; skipping ping-failure test")
	}
	if !strings.Contains(err.Error(), "ping") {
		t.Errorf("expected ping-related error, got: %v", err)
	}
}
