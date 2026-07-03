package flo

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"
)

const (
	defaultTimeout = 30 * time.Second
	maxRetries     = 3
)

// typed JSON-RPC client for a FLO daemon.
type Client struct {
	url    string
	user   string
	pass   string
	client *http.Client

	// testing
	now func() time.Time
}

// New creates a new FLO RPC client.
func New(rpcURL, user, pass string) *Client {
	return &Client{
		url:    rpcURL,
		user:   user,
		pass:   pass,
		client: &http.Client{Timeout: defaultTimeout},
		now:    time.Now,
	}
}

// ping health check
func (c *Client) Ping(ctx context.Context) error {
	_, err := c.call(ctx, "ping", nil)
	return err
}

// call performs a JSON-RPC request with retry logic.
func (c *Client) call(ctx context.Context, method string, params []any) (json.RawMessage, error) {
	req := rpcRequest{
		JSONRPC: "1.0",
		ID:      1,
		Method:  method,
		Params:  params,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("flo: marshal request: %w", err)
	}

	var lastErr error
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(backoff(attempt)):
			}
		}

		result, err := c.do(ctx, body)
		if err == nil {
			return result, nil
		}
		lastErr = err

		// Don't retry on context cancellation or invalid requests
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		if rpcErr, ok := err.(*RPCError); ok && rpcErr.Code != -1 {
			return nil, err
		}
	}

	return nil, fmt.Errorf("flo: %s: %w after %d retries", method, lastErr, maxRetries)
}

// single HTTP request to the FLO RPC endpoint.
func (c *Client) do(ctx context.Context, body []byte) (json.RawMessage, error) {
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url, io.NopCloser(bytes.NewReader(body)))
	if err != nil {
		return nil, fmt.Errorf("flo: create request: %w", err)
	}
	httpReq.SetBasicAuth(c.user, c.pass)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("flo: do request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("flo: read body: %w", err)
	}

	var rpcResp rpcResponse
	if err := json.Unmarshal(respBody, &rpcResp); err != nil {
		return nil, fmt.Errorf("flo: unmarshal response: %w", err)
	}

	if rpcResp.Error != nil {
		return nil, rpcResp.Error
	}

	return *rpcResp.Result, nil
}

// backoff returns a duration for the given attempt number (1-based).
// Uses exponential backoff with jitter.
func backoff(attempt int) time.Duration {
	if attempt <= 0 {
		return 0
	}
	base := time.Duration(100*attempt) * time.Millisecond
	jitter := time.Duration(rand.Int63n(int64(base)))
	return base + jitter
}
