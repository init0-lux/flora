package main

import (
	"bytes"
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

	"github.com/prometheus/client_golang/prometheus"
)

var (
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "fiber_requests_total",
			Help: "Total number of HTTP requests.",
		},
		[]string{"method", "path", "status"},
	)
	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "fiber_request_duration_seconds",
			Help:    "HTTP request duration in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)
	blockHeightGauge = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "flora_block_height",
		Help: "Current block height from the FLO node.",
	})
	mempoolSizeGauge = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "flora_mempool_size",
		Help: "Number of transactions in the mempool.",
	})
	dbConnectionsGauge = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "flora_db_connections",
		Help: "Number of active database connections.",
	})
)

func init() {
	prometheus.MustRegister(httpRequestsTotal, httpRequestDuration, blockHeightGauge, mempoolSizeGauge, dbConnectionsGauge)
}

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

	// Prometheus metrics middleware
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		dur := time.Since(start).Seconds()
		httpRequestsTotal.WithLabelValues(c.Method(), c.Path(), fmt.Sprintf("%d", c.Response().StatusCode())).Inc()
		httpRequestDuration.WithLabelValues(c.Method(), c.Path()).Observe(dur)
		return err
	})

	// Background metrics updater
	go func() {
		for {
			time.Sleep(30 * time.Second)
			info, err := floClient.GetBlockchainInfo(context.Background())
			if err == nil {
				blockHeightGauge.Set(float64(info.Blocks))
			}
			poolStat := pool.Pool.Stat()
			dbConnectionsGauge.Set(float64(poolStat.TotalConns()))
		}
	}()

	q := repository.New(pool.Pool)
	h := &handler{
		log:  log,
		db:   q,
		pool: pool.Pool,
		flo:  floClient,
	}

	app.Get("/health", h.health)
	app.Get("/metrics", h.metrics)
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

	app.Get("/api/v1/txs", h.getRecentTxs)
	app.Get("/api/v1/network", h.getNetwork)

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

func (h *handler) metrics(c *fiber.Ctx) error {
	c.Response().Header.SetContentType("text/plain; version=0.0.4; charset=utf-8")
	metricFamilies, err := prometheus.DefaultGatherer.Gather()
	if err != nil {
		return err
	}
	var buf bytes.Buffer
	for _, mf := range metricFamilies {
		for _, m := range mf.GetMetric() {
			buf.WriteString(mf.GetName())
			// Simplified — just output the name and value
			buf.WriteString(" ")
			if m.Counter != nil {
				buf.WriteString(fmt.Sprintf("%v\n", m.Counter.GetValue()))
			} else if m.Gauge != nil {
				buf.WriteString(fmt.Sprintf("%v\n", m.Gauge.GetValue()))
			} else if m.Histogram != nil {
				buf.WriteString(fmt.Sprintf("%v\n", m.Histogram.GetSampleCount()))
			}
		}
	}
	c.Response().SetBody(buf.Bytes())
	return nil
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
