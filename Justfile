# FLO Explorer — task runner

alias d := dev

# Start all local infrastructure
dev:
    docker compose up -d
    echo "postgres :5432  redis :6379  nats :4222"

# Stop all local infrastructure
down:
    docker compose down

# Reset all data volumes
reset:
    docker compose down -v
    docker compose up -d

# Run all unit tests
test:
    go test ./...

# Run lint
lint:
    golangci-lint run ./...

# Build all Go binaries
build:
    go build ./apps/...

# Run the API server
api:
    go run ./apps/api

# Run the chain indexer
indexer:
    go run ./apps/chain-indexer

# Run database migrations (up)
migrate-up:
    goose -dir sql/migrations postgres "postgres://flora:flora@localhost:5432/flora?sslmode=disable" up

# Run database migrations (down)
migrate-down:
    goose -dir sql/migrations postgres "postgres://flora:flora@localhost:5432/flora?sslmode=disable" down

# Show migration status
migrate-status:
    goose -dir sql/migrations postgres "postgres://flora:flora@localhost:5432/flora?sslmode=disable" status

# Generate sqlc code
sqlc-gen:
    sqlc generate

# Clean build artifacts
clean:
    rm -rf dist/
    go clean -cache

# Show help
help:
    @just --list
