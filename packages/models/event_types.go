package models

// BlockConnected is published when a new block is detected on the canonical chain.
type BlockConnected struct {
	Hash         string        `json:"hash"`
	Height       int64         `json:"height"`
	Time         int64         `json:"time"`
	Size         int64         `json:"size"`
	Weight       int64         `json:"weight"`
	Version      int64         `json:"version"`
	MerkleRoot   string        `json:"merkleroot"`
	Bits         string        `json:"bits"`
	Nonce        int64         `json:"nonce"`
	Difficulty   float64       `json:"difficulty"`
	Chainwork    string        `json:"chainwork"`
	PrevHash     string        `json:"prev_hash"`
	TxCount      int64         `json:"tx_count"`
	Transactions []Transaction `json:"transactions"`
}

// BlockDisconnected is published when a block is removed from the canonical chain during a reorg.
type BlockDisconnected struct {
	Hash   string `json:"hash"`
	Height int64  `json:"height"`
	Time   int64  `json:"time"`
}

// TxConfirmed is published when a transaction is included in a block on the canonical chain.
type TxConfirmed struct {
	TxID        string       `json:"txid"`
	BlockHash   string       `json:"block_hash"`
	BlockHeight int64        `json:"block_height"`
	BlockTime   int64        `json:"block_time"`
	Transaction *Transaction `json:"transaction"`
}

// TxMempoolAdded is published when a new transaction enters the mempool.
type TxMempoolAdded struct {
	TxID  string `json:"txid"`
	Time  int64  `json:"time"`
	Size  int64  `json:"size"`
	VSize int64  `json:"vsize"`
	Fee   int64  `json:"fee"`
}

// TxMempoolRemoved is published when a transaction leaves the mempool.
type TxMempoolRemoved struct {
	TxID string `json:"txid"`
}

// Transaction is a simplified transaction model for event payloads.
type Transaction struct {
	TxID  string `json:"txid"`
	Hash  string `json:"hash"`
	Size  int64  `json:"size"`
	VSize int64  `json:"vsize"`
	Vin   []Vin  `json:"vin"`
	Vout  []Vout `json:"vout"`
}

// Vin represents a transaction input in event payloads.
type Vin struct {
	Coinbase  string `json:"coinbase,omitempty"`
	TxID      string `json:"txid,omitempty"`
	Vout      int64  `json:"vout,omitempty"`
	ScriptSig string `json:"script_sig,omitempty"`
	Sequence  int64  `json:"sequence"`
}

// Vout represents a transaction output in event payloads.
type Vout struct {
	Value            int64    `json:"value"`
	N                int64    `json:"n"`
	ScriptPubKeyHex  string   `json:"script_pub_key_hex"`
	ScriptPubKeyType string   `json:"script_pub_key_type"`
	Addresses        []string `json:"addresses"`
}
