package flo

import (
	"encoding/json"
	"fmt"
)

// RPCError represents a JSON-RPC error response.
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *RPCError) Error() string {
	return fmt.Sprintf("flo rpc error: code=%d message=%q", e.Code, e.Message)
}

// rpcRequest represents a JSON-RPC 1.0 request.
type rpcRequest struct {
	JSONRPC string `json:"jsonrpc"`
	ID      int    `json:"id"`
	Method  string `json:"method"`
	Params  []any  `json:"params"`
}

// rpcResponse represents a JSON-RPC 1.0 response.
type rpcResponse struct {
	JSONRPC string           `json:"jsonrpc"`
	ID      int              `json:"id"`
	Result  *json.RawMessage `json:"result"`
	Error   *RPCError        `json:"error"`
}
