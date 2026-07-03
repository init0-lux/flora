package logger

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// New creates a slog.Logger configured for the given level string.
// When output is a terminal the handler uses human-readable text format.
// Otherwise (pipe, file, daemon) it uses JSON.
func New(level string) (*slog.Logger, error) {
	lvl, err := ParseLevel(level)
	if err != nil {
		return nil, err
	}

	var handler slog.Handler
	opts := &slog.HandlerOptions{Level: lvl}

	if isTerminal(os.Stdout) {
		opts.AddSource = true
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}

	return slog.New(handler), nil
}

// ParseLevel converts a case-insensitive level string to slog.Level.
func ParseLevel(level string) (slog.Level, error) {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug":
		return slog.LevelDebug, nil
	case "info":
		return slog.LevelInfo, nil
	case "warn", "warning":
		return slog.LevelWarn, nil
	case "error":
		return slog.LevelError, nil
	default:
		return slog.LevelInfo, nil
	}
}

// isTerminal returns true if w is connected to a terminal.
func isTerminal(w io.Writer) bool {
	f, ok := w.(*os.File)
	if !ok {
		return false
	}
	stat, err := f.Stat()
	if err != nil {
		return false
	}
	return (stat.Mode() & os.ModeCharDevice) != 0
}
