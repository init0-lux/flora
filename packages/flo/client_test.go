package flo

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// testRPCResponse returns an httptest.Server that responds with the given
// result for any valid JSON-RPC request, or returns the given error.
func testRPCServer(t *testing.T, result interface{}, rpcErr *RPCError) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify auth
		user, pass, ok := r.BasicAuth()
		if !ok || user != "user" || pass != "pass" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		var resp rpcResponse
		if rpcErr != nil {
			resp = rpcResponse{
				JSONRPC: "1.0",
				ID:      1,
				Error:   rpcErr,
			}
		} else {
			raw, _ := json.Marshal(result)
			resp = rpcResponse{
				JSONRPC: "1.0",
				ID:      1,
				Result:  (*json.RawMessage)(&raw),
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
}

func TestPing(t *testing.T) {
	srv := testRPCServer(t, "ok", nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	if err := client.Ping(context.Background()); err != nil {
		t.Fatalf("Ping: %v", err)
	}
}

func TestGetBestBlockHash(t *testing.T) {
	want := "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
	srv := testRPCServer(t, want, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetBestBlockHash(context.Background())
	if err != nil {
		t.Fatalf("GetBestBlockHash: %v", err)
	}
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestGetBlockCount(t *testing.T) {
	want := int64(800000)
	srv := testRPCServer(t, want, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetBlockCount(context.Background())
	if err != nil {
		t.Fatalf("GetBlockCount: %v", err)
	}
	if got != want {
		t.Errorf("got %d, want %d", got, want)
	}
}

func TestGetBlockHash(t *testing.T) {
	want := "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
	srv := testRPCServer(t, want, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetBlockHash(context.Background(), 1)
	if err != nil {
		t.Fatalf("GetBlockHash: %v", err)
	}
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestGetBlock(t *testing.T) {
	block := &Block{
		Hash:              "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
		Confirmations:     1,
		Size:              1000,
		Height:            1,
		Version:           1,
		MerkleRoot:        "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
		Time:              1231469665,
		Nonce:             2573394689,
		Bits:              "1d00ffff",
		Difficulty:        1,
		Chainwork:         "0000000000000000000000000000000000000000000000000000000200020002",
		PreviousBlockHash: "0000000000000000000000000000000000000000000000000000000000000000",
	}
	srv := testRPCServer(t, block, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetBlock(context.Background(), block.Hash)
	if err != nil {
		t.Fatalf("GetBlock: %v", err)
	}
	if got.Hash != block.Hash {
		t.Errorf("Hash = %q, want %q", got.Hash, block.Hash)
	}
	if got.Height != block.Height {
		t.Errorf("Height = %d, want %d", got.Height, block.Height)
	}
}

func TestGetRawTransaction(t *testing.T) {
	tx := &Transaction{
		TxID:  "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16",
		Hash:  "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16",
		Size:  275,
		VSize: 275,
		Vin: []Vin{
			{
				Coinbase: "04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73",
				Sequence: 4294967295,
			},
		},
		Vout: []Vout{
			{
				Value: 50.00000000,
				N:     0,
				ScriptPubKey: ScriptPubKey{
					Asm:  "OP_DUP OP_HASH160 404371705fa9bd789a2fcd52d2c580b65d35549d OP_EQUALVERIFY OP_CHECKSIG",
					Hex:  "4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac",
					Type: "pubkey",
				},
			},
		},
	}
	srv := testRPCServer(t, tx, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetRawTransaction(context.Background(), tx.TxID)
	if err != nil {
		t.Fatalf("GetRawTransaction: %v", err)
	}
	if got.TxID != tx.TxID {
		t.Errorf("TxID = %q, want %q", got.TxID, tx.TxID)
	}
	if len(got.Vout) != 1 {
		t.Errorf("len(Vout) = %d, want 1", len(got.Vout))
	}
}

func TestGetRawMempool(t *testing.T) {
	want := []string{"txid1", "txid2", "txid3"}
	srv := testRPCServer(t, want, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetRawMempool(context.Background())
	if err != nil {
		t.Fatalf("GetRawMempool: %v", err)
	}
	if len(got) != 3 {
		t.Errorf("len = %d, want 3", len(got))
	}
}

func TestGetBlockchainInfo(t *testing.T) {
	info := &BlockchainInfo{
		Chain:                "main",
		Blocks:               800000,
		Headers:              800000,
		BestBlockHash:        "000000000000000000024bef4a2f0a1b936ba40254ecb9f04b073640e6dff31b",
		Difficulty:           123456.78,
		MedianTime:           1700000000,
		VerificationProgress: 0.999999,
		Chainwork:            "000000000000000000000000000000000000000000011a2e2f3e18e5e3e14a7a",
	}
	srv := testRPCServer(t, info, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetBlockchainInfo(context.Background())
	if err != nil {
		t.Fatalf("GetBlockchainInfo: %v", err)
	}
	if got.Chain != info.Chain {
		t.Errorf("Chain = %q, want %q", got.Chain, info.Chain)
	}
	if got.Blocks != info.Blocks {
		t.Errorf("Blocks = %d, want %d", got.Blocks, info.Blocks)
	}
}

func TestGetNetworkInfo(t *testing.T) {
	info := &NetworkInfo{
		Version:         270000,
		SubVersion:      "/FLO:5.3.0/",
		ProtocolVersion: 70015,
		Connections:     8,
		NetworkActive:   true,
	}
	srv := testRPCServer(t, info, nil)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	got, err := client.GetNetworkInfo(context.Background())
	if err != nil {
		t.Fatalf("GetNetworkInfo: %v", err)
	}
	if got.SubVersion != info.SubVersion {
		t.Errorf("SubVersion = %q, want %q", got.SubVersion, info.SubVersion)
	}
	if got.Connections != info.Connections {
		t.Errorf("Connections = %d, want %d", got.Connections, info.Connections)
	}
}

func TestRPCError(t *testing.T) {
	rpcErr := &RPCError{Code: -5, Message: "No such block"}
	srv := testRPCServer(t, nil, rpcErr)
	defer srv.Close()

	client := New(srv.URL, "user", "pass")
	_, err := client.GetBestBlockHash(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if rpcErr, ok := err.(*RPCError); ok {
		if rpcErr.Code != -5 {
			t.Errorf("code = %d, want -5", rpcErr.Code)
		}
	} else {
		t.Errorf("expected *RPCError, got %T", err)
	}
}

func TestUnauthorized(t *testing.T) {
	srv := testRPCServer(t, "ok", nil)
	defer srv.Close()

	client := New(srv.URL, "wrong", "wrong")
	_, err := client.GetBestBlockHash(context.Background())
	if err == nil {
		t.Fatal("expected error for bad auth, got nil")
	}
}
