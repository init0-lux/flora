package flo

import "encoding/json"

// Block represents a FLO block from getblock verbose=true.
type Block struct {
	Hash              string          `json:"hash"`
	Confirmations     int64           `json:"confirmations"`
	Size              int64           `json:"size"`
	Weight            int64           `json:"weight"`
	Height            int64           `json:"height"`
	Version           int64           `json:"version"`
	VersionHex        string          `json:"versionHex"`
	MerkleRoot        string          `json:"merkleroot"`
	Tx                json.RawMessage `json:"tx"` // []string or []Transaction
	Time              int64           `json:"time"`
	MedianTime        int64           `json:"mediantime"`
	Nonce             int64           `json:"nonce"`
	Bits              string          `json:"bits"`
	Difficulty        float64         `json:"difficulty"`
	Chainwork         string          `json:"chainwork"`
	PreviousBlockHash string          `json:"previousblockhash"`
	NextBlockHash     string          `json:"nextblockhash,omitempty"`
}

// Transaction represents a FLO transaction from getrawtransaction verbose=true.
type Transaction struct {
	TxID          string `json:"txid"`
	Hash          string `json:"hash"`
	Version       int64  `json:"version"`
	Size          int64  `json:"size"`
	VSize         int64  `json:"vsize"`
	Weight        int64  `json:"weight"`
	LockTime      int64  `json:"locktime"`
	Vin           []Vin  `json:"vin"`
	Vout          []Vout `json:"vout"`
	BlockHash     string `json:"blockhash,omitempty"`
	BlockHeight   int64  `json:"blockheight,omitempty"`
	Confirmations int64  `json:"confirmations,omitempty"`
	BlockTime     int64  `json:"blocktime,omitempty"`
	Time          int64  `json:"time,omitempty"`
}

// Vin represents a transaction input.
type Vin struct {
	Coinbase    string     `json:"coinbase,omitempty"`
	TxID        string     `json:"txid,omitempty"`
	Vout        int64      `json:"vout,omitempty"`
	ScriptSig   *ScriptSig `json:"scriptSig,omitempty"`
	Sequence    int64      `json:"sequence"`
	TxInWitness []string   `json:"txinwitness,omitempty"`
}

// Vout represents a transaction output.
type Vout struct {
	Value        float64      `json:"value"`
	N            int64        `json:"n"`
	ScriptPubKey ScriptPubKey `json:"scriptPubKey"`
}

// ScriptSig represents the script signature in a transaction input.
type ScriptSig struct {
	Asm string `json:"asm"`
	Hex string `json:"hex"`
}

// ScriptPubKey represents the script public key in a transaction output.
type ScriptPubKey struct {
	Asm       string   `json:"asm"`
	Hex       string   `json:"hex"`
	Type      string   `json:"type"`
	Addresses []string `json:"addresses,omitempty"`
	ReqSigs   int64    `json:"reqSigs,omitempty"`
}

// BlockchainInfo represents the result of getblockchaininfo.
type BlockchainInfo struct {
	Chain                string  `json:"chain"`
	Blocks               int64   `json:"blocks"`
	Headers              int64   `json:"headers"`
	BestBlockHash        string  `json:"bestblockhash"`
	Difficulty           float64 `json:"difficulty"`
	MedianTime           int64   `json:"mediantime"`
	VerificationProgress float64 `json:"verificationprogress"`
	Chainwork            string  `json:"chainwork"`
}

// NetworkInfo represents the result of getnetworkinfo.
type NetworkInfo struct {
	Version         int64  `json:"version"`
	SubVersion      string `json:"subversion"`
	ProtocolVersion int64  `json:"protocolversion"`
	LocalServices   string `json:"localservices"`
	Connections     int64  `json:"connections"`
	NetworkActive   bool   `json:"networkactive"`
}
