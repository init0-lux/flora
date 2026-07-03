package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/init0/flora/packages/indexer"

	"github.com/init0/flora/packages/config"
	"github.com/init0/flora/packages/eventbus"
	"github.com/init0/flora/packages/flo"
	"github.com/init0/flora/packages/logger"
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

	floClient := flo.New(cfg.FLORPCURL, cfg.FLORPCUser, cfg.FLORPCPass)

	bus, err := eventbus.NewNatsPublisher(cfg.NATSURL)
	if err != nil {
		log.Error("nats publisher", "error", err)
		os.Exit(1)
	}
	defer bus.Close()

	scanner := indexer.New(floClient, bus)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info("chain-indexer starting")
		if err := scanner.Run(ctx); err != nil && err != context.Canceled {
			log.Error("scanner", "error", err)
			os.Exit(1)
		}
	}()

	sig := <-quit
	log.Info("shutting down", "signal", sig)
	cancel()
	time.Sleep(100 * time.Millisecond)
}
