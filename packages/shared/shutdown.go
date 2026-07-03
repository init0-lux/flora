package shared

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

// service that can gracefully shut down.
type Server interface {
	Shutdown(ctx context.Context) error
}

// GracefulShutdown listens for SIGINT or SIGTERM and calls each server's
// Shutdown method in parallel. If shutdowns do not complete within timeout,
// the process exits with status 1.
func GracefulShutdown(ctx context.Context, log *slog.Logger, timeout time.Duration, servers ...Server) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	sig := <-quit
	log.InfoContext(ctx, "received signal, starting graceful shutdown",
		slog.String("signal", sig.String()),
	)

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var wg sync.WaitGroup
	for _, s := range servers {
		wg.Add(1)
		go func(s Server) {
			defer wg.Done()
			if err := s.Shutdown(ctx); err != nil {
				log.ErrorContext(ctx, "shutdown error", slog.String("error", err.Error()))
			}
		}(s)
	}
	wg.Wait()

	log.InfoContext(ctx, "shutdown complete")
}
