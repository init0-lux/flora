package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/init0/flora/packages/config"
	"github.com/init0/flora/packages/db"
	"github.com/init0/flora/packages/eventbus"
	"github.com/init0/flora/packages/logger"
	"github.com/init0/flora/packages/writer"
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

	sub, err := eventbus.NewNatsSubscriber(cfg.NATSURL)
	if err != nil {
		log.Error("nats subscriber", "error", err)
		os.Exit(1)
	}
	defer sub.Close()

	w := writer.New(pool.Pool, sub)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info("state-writer starting")
		if err := w.Run(ctx); err != nil && err != context.Canceled {
			log.Error("writer", "error", err)
			os.Exit(1)
		}
	}()

	sig := <-quit
	log.Info("shutting down", "signal", sig)
	cancel()
	time.Sleep(100 * time.Millisecond)
}
