package config

import (
	"fmt"
	"os"
	"reflect"
	"strconv"
	"strings"
)

// vars from env or .env
func Load() (*Config, error) {
	_ = tryLoadEnvFile(".env")
	return LoadFrom(os.LookupEnv)
}

func LoadFrom(lookup func(string) (string, bool)) (*Config, error) {
	cfg := &Config{}
	if err := populate(cfg, lookup); err != nil {
		return nil, err
	}
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

// populate uses reflection to set struct fields based on `env` tags.
func populate(v any, lookup func(string) (string, bool)) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Ptr || rv.Elem().Kind() != reflect.Struct {
		return fmt.Errorf("config: must be a pointer to a struct")
	}
	rt := rv.Type().Elem()

	for i := range rt.NumField() {
		field := rt.Field(i)
		fieldVal := rv.Elem().Field(i)

		if !fieldVal.CanSet() {
			continue
		}

		tag := field.Tag.Get("env")
		if tag == "" {
			continue
		}

		val, ok := lookup(tag)
		if !ok {
			val = field.Tag.Get("default")
		}

		if val == "" {
			if field.Tag.Get("required") == "true" {
				return fmt.Errorf("config: required environment variable %q is not set", tag)
			}
			continue
		}

		switch fieldVal.Kind() {
		case reflect.String:
			fieldVal.SetString(val)
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			n, err := strconv.ParseInt(val, 10, fieldVal.Type().Bits())
			if err != nil {
				return fmt.Errorf("config: %q: invalid integer %q: %w", tag, val, err)
			}
			fieldVal.SetInt(n)
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			n, err := strconv.ParseUint(val, 10, fieldVal.Type().Bits())
			if err != nil {
				return fmt.Errorf("config: %q: invalid unsigned integer %q: %w", tag, val, err)
			}
			fieldVal.SetUint(n)
		case reflect.Bool:
			b, err := strconv.ParseBool(val)
			if err != nil {
				return fmt.Errorf("config: %q: invalid boolean %q: %w", tag, val, err)
			}
			fieldVal.SetBool(b)
		default:
			return fmt.Errorf("config: unsupported field type %s for %q", fieldVal.Kind(), tag)
		}
	}

	return nil
}

// tryLoadEnvFile reads a simple KEY=VALUE file and sets each key into the
// process environment. Lines starting with # are skipped.
func tryLoadEnvFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err // file not found is expected
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.TrimSpace(v)
		// Only set if not already present in the environment.
		if _, exists := os.LookupEnv(k); !exists {
			os.Setenv(k, v)
		}
	}
	return nil
}
