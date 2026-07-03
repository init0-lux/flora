package config

import (
	"testing"
)

func TestLoadFrom_populatesDefaults(t *testing.T) {
	lookup := func(key string) (string, bool) {
		switch key {
		case "FLO_RPC_URL":
			return "http://localhost:1234", true
		case "FLO_RPC_USER":
			return "rpcuser", true
		case "FLO_RPC_PASS":
			return "rpcpass", true
		}
		return "", false
	}

	cfg, err := LoadFrom(lookup)
	if err != nil {
		t.Fatalf("LoadFrom failed: %v", err)
	}

	if cfg.AppName != "flora" {
		t.Errorf("AppName = %q, want %q", cfg.AppName, "flora")
	}
	if cfg.LogLevel != "info" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "info")
	}
	if cfg.APIPort != 3000 {
		t.Errorf("APIPort = %d, want %d", cfg.APIPort, 3000)
	}
	if cfg.APIHost != "0.0.0.0" {
		t.Errorf("APIHost = %q, want %q", cfg.APIHost, "0.0.0.0")
	}
	if cfg.FLORPCURL != "http://localhost:1234" {
		t.Errorf("FLORPCURL = %q, want %q", cfg.FLORPCURL, "http://localhost:1234")
	}
	if cfg.DatabaseURL != "postgres://flora:flora@localhost:5432/flora?sslmode=disable" {
		t.Errorf("DatabaseURL = %q, want %q", cfg.DatabaseURL, "postgres://flora:flora@localhost:5432/flora?sslmode=disable")
	}
}

func TestLoadFrom_requiredFields(t *testing.T) {
	lookup := func(key string) (string, bool) {
		return "", false
	}

	_, err := LoadFrom(lookup)
	if err == nil {
		t.Fatal("expected error for missing required fields, got nil")
	}
}

func TestLoadFrom_overrides(t *testing.T) {
	lookup := func(key string) (string, bool) {
		switch key {
		case "FLO_RPC_URL":
			return "http://localhost:1234", true
		case "FLO_RPC_USER":
			return "rpcuser", true
		case "FLO_RPC_PASS":
			return "rpcpass", true
		case "APP_NAME":
			return "my-flora", true
		case "LOG_LEVEL":
			return "debug", true
		case "API_PORT":
			return "8080", true
		case "API_HOST":
			return "127.0.0.1", true
		}
		return "", false
	}

	cfg, err := LoadFrom(lookup)
	if err != nil {
		t.Fatalf("LoadFrom failed: %v", err)
	}

	if cfg.AppName != "my-flora" {
		t.Errorf("AppName = %q, want %q", cfg.AppName, "my-flora")
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "debug")
	}
	if cfg.APIPort != 8080 {
		t.Errorf("APIPort = %d, want %d", cfg.APIPort, 8080)
	}
	if cfg.APIHost != "127.0.0.1" {
		t.Errorf("APIHost = %q, want %q", cfg.APIHost, "127.0.0.1")
	}
}

func TestValidate_badPort(t *testing.T) {
	cfg := &Config{
		APIPort:     0,
		FLORPCURL:   "http://localhost:1234",
		DatabaseURL: "postgres://localhost/flora?sslmode=disable",
		RedisURL:    "redis://localhost:6379",
		NATSURL:     "nats://localhost:4222",
	}
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected validation error for port 0")
	}
}

func TestValidate_missingRequired(t *testing.T) {
	lookup := func(key string) (string, bool) {
		switch key {
		case "FLO_RPC_URL":
			return "http://localhost:1234", true
		case "FLO_RPC_USER":
			return "rpcuser", true
		// FLO_RPC_PASS not provided
		case "FLO_RPC_PASS":
			return "", false
		}
		return "", false
	}

	_, err := LoadFrom(lookup)
	if err == nil {
		t.Fatal("expected error for missing FLO_RPC_PASS, got nil")
	}
}
