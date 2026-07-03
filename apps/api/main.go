package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/init0/flora/packages/config"
	"github.com/init0/flora/packages/db"
	"github.com/init0/flora/packages/db/repository"
	"github.com/init0/flora/packages/flo"
	"github.com/init0/flora/packages/logger"
	"github.com/init0/flora/packages/shared"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config", "error", err)
		os.Exit(1)
	}

	log, err := logger.New(cfg.LogLevel)
	if err != nil {
		slog.Error("logger", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("db pool", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	floClient := flo.New(cfg.FLORPCURL, cfg.FLORPCUser, cfg.FLORPCPass)

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
	}))

	app.Use(func(c *fiber.Ctx) error {
		id := c.Get("X-Request-ID")
		if id == "" {
			id = fmt.Sprintf("%d", c.Context().ID())
		}
		c.Set("X-Request-ID", id)
		return c.Next()
	})

	q := repository.New(pool.Pool)
	h := &handler{
		log:  log,
		db:   q,
		pool: pool.Pool,
		flo:  floClient,
	}

	app.Get("/health", h.health)
	app.Get("/api/v1/status", h.status)

	app.Get("/api/v1/block/:hash", h.getBlockByHash)
	app.Get("/api/v1/block-height/:height", h.getBlockByHeight)
	app.Get("/api/v1/blocks", h.getBlocks)

	app.Get("/api/v1/tx/:txid", h.getTx)
	app.Get("/api/v1/block/:hash/txs", h.getBlockTxs)

	app.Get("/api/v1/address/:address", h.getAddress)
	app.Get("/api/v1/address/:address/txs", h.getAddressTxs)
	app.Get("/api/v1/utxo/:address", h.getUtxos)

	app.Get("/api/v1/mempool", h.getMempool)
	app.Get("/api/v1/mempool/:txid", h.getMempoolTx)

	app.Get("/api/v1/search/:query", h.search)

	addr := cfg.APIHost + ":" + itoa(cfg.APIPort)

	go func() {
		log.Info("api listening", "addr", addr)
		if err := app.Listen(addr); err != nil {
			log.Error("api listen", "error", err)
			os.Exit(1)
		}
	}()

	shared.GracefulShutdown(ctx, log, 30*time.Second, &fiberServer{app: app})
}

type fiberServer struct {
	app *fiber.App
}

func (s *fiberServer) Shutdown(ctx context.Context) error {
	return s.app.ShutdownWithContext(ctx)
}

type handler struct {
	log  *slog.Logger
	db   *repository.Queries
	pool *pgxpool.Pool
	flo  *flo.Client
}

func (h *handler) health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}

func (h *handler) status(c *fiber.Ctx) error {
	info, err := h.flo.GetBlockchainInfo(context.Background())
	if err != nil {
		return c.Status(503).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"blockbook": fiber.Map{
			"coin":      "FLO",
			"host":      c.Hostname(),
			"version":   "0.1.0",
			"gitCommit": "",
			"buildTime": "",
		},
		"backend": fiber.Map{
			"chain":         info.Chain,
			"blocks":        info.Blocks,
			"headers":       info.Headers,
			"bestBlockHash": info.BestBlockHash,
			"difficulty":    info.Difficulty,
		},
	})
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}
