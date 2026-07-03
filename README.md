# FLO Explorer

A production-ready, Blockbook-compatible blockchain explorer for the FLO
network. Built with Go, NATS JetStream, PostgreSQL, Redis, and Next.js.

## Architecture

```
                         ┌─────────────┐
                         │   FLO Node  │
                         │  (JSON-RPC) │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │chain-indexer│
                         │  (scanner)  │
                         └──────┬──────┘
                                │ NATS JetStream
                         ┌──────▼──────┐
                         │ state-writer│
                         │ (projection)│
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │  PostgreSQL │
                         │ (serving DB)│
                         └──────┬──────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼────┐  ┌───▼───┐ ┌─────▼────┐
              │  API     │  │ Redis │ │  Admin   │
              │ (Fiber)  │  │(cache)│ │ (future) │
              └─────┬────┘  └───────┘ └──────────┘
                    │
              ┌─────▼────┐
              │ Frontend │
              │(Next.js) │
              └──────────┘
```

### Components

| Component       | Role                                        |
|-----------------|---------------------------------------------|
| **chain-indexer** | Scans FLO node for new blocks, reorgs, mempool. Publishes events to NATS. |
| **state-writer**  | Consumes events from NATS, maintains serving tables in PostgreSQL. |
| **api**           | Fiber HTTP server exposing Blockbook-compatible REST endpoints. |
| **frontend**      | Next.js explorer UI (App Router, TanStack Query, Tailwind, shadcn/ui). |

### Services (infrastructure)

| Service      | Port  | Purpose                             |
|-------------|-------|-------------------------------------|
| PostgreSQL  | 5432  | Primary data store (projections).   |
| Redis       | 6379  | API response cache.                 |
| NATS        | 4222  | Event bus between indexer & writer. |
| NATS (mon)  | 8222  | NATS monitoring HTTP endpoint.      |

## Quick Start

```bash
# Start infrastructure
docker compose up -d

# Run the API server
go run ./apps/api

# In another terminal, run the chain indexer
go run ./apps/chain-indexer
```

## Development

```bash
# Enter the Nix dev shell
nix develop

# Run tests
just test

# Build everything
just build

# Database migrations
just migrate-up
just migrate-status
```

## Project Layout

```
apps/              # Runnable applications
├── api/           # Fiber HTTP server
├── chain-indexer/ # Blockchain scanner
├── state-writer/  # Event consumer / projection engine
├── admin/         # Admin interface (future)
├── frontend/      # Next.js UI (App Router, TanStack Query, Tailwind, shadcn/ui)

packages/          # Shared Go libraries
├── config/        # Environment-based configuration
├── cache/         # Redis cache abstraction
├── db/            # PostgreSQL pool & sqlc repositories
├── eventbus/      # NATS JetStream pub/sub
├── flo/           # FLO RPC client
├── logger/        # Structured logging (slog)
├── models/        # Shared domain types
└── shared/        # Utilities (shutdown, health)

sql/
├── migrations/    # Goose migrations
└── queries/       # sqlc query files

deployments/       # Production configs (Docker, Nginx, etc.)
docs/              # Additional documentation
```
