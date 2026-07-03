package config

import (
	"fmt"
	"strings"
)

type Config struct {
	AppName  string `env:"APP_NAME"  default:"flora"`
	LogLevel string `env:"LOG_LEVEL" default:"info"`

	// FLO RPC
	FLORPCURL  string `env:"FLO_RPC_URL"  required:"true"`
	FLORPCUser string `env:"FLO_RPC_USER" required:"true"`
	FLORPCPass string `env:"FLO_RPC_PASS" required:"true"`

	DatabaseURL string `env:"DATABASE_URL" default:"postgres://flora:flora@localhost:5432/flora?sslmode=disable"`
	RedisURL    string `env:"REDIS_URL" default:"redis://localhost:6379"`

	// NATS
	NATSURL string `env:"NATS_URL" default:"nats://localhost:4222"`

	APIHost string `env:"API_HOST" default:"0.0.0.0"`
	APIPort int    `env:"API_PORT" default:"3000"`
}

// Validate checks the configuration for correctness.
func (c *Config) Validate() error {
	var errs []string

	if c.APIPort <= 0 || c.APIPort > 65535 {
		errs = append(errs, "API_PORT must be between 1 and 65535")
	}

	if !strings.HasPrefix(c.FLORPCURL, "http://") && !strings.HasPrefix(c.FLORPCURL, "https://") {
		errs = append(errs, "FLO_RPC_URL must start with http:// or https://")
	}

	if !strings.HasPrefix(c.DatabaseURL, "postgres://") {
		errs = append(errs, "DATABASE_URL must start with postgres://")
	}

	if !strings.HasPrefix(c.RedisURL, "redis://") && !strings.HasPrefix(c.RedisURL, "rediss://") {
		errs = append(errs, "REDIS_URL must start with redis:// or rediss://")
	}

	if !strings.HasPrefix(c.NATSURL, "nats://") {
		errs = append(errs, "NATS_URL must start with nats://")
	}

	if len(errs) > 0 {
		return fmt.Errorf("config validation failed:\n  - %s", strings.Join(errs, "\n  - "))
	}
	return nil
}
