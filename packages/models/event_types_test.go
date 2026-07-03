package models

import (
	"encoding/json"
	"testing"
)

func TestBlockConnectedRoundTrip(t *testing.T) {
	original := BlockConnected{
		Hash:       "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
		Height:     1,
		Time:       1231469665,
		Size:       1000,
		Weight:     4000,
		Version:    1,
		MerkleRoot: "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098",
		Bits:       "1d00ffff",
		Nonce:      2573394689,
		Difficulty: 1,
		Chainwork:  "0000000000000000000000000000000000000000000000000000000200020002",
		PrevHash:   "0000000000000000000000000000000000000000000000000000000000000000",
		TxCount:    1,
		Transactions: []Transaction{
			{
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
						Value:            5000000000,
						N:                0,
						ScriptPubKeyHex:  "4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac",
						ScriptPubKeyType: "pubkey",
						Addresses:        []string{"FLO_ADDRESS_1"},
					},
				},
			},
		},
	}

	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	var decoded BlockConnected
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	if decoded.Hash != original.Hash {
		t.Errorf("Hash = %q, want %q", decoded.Hash, original.Hash)
	}
	if decoded.Height != original.Height {
		t.Errorf("Height = %d, want %d", decoded.Height, original.Height)
	}
	if decoded.TxCount != original.TxCount {
		t.Errorf("TxCount = %d, want %d", decoded.TxCount, original.TxCount)
	}
	if len(decoded.Transactions) != 1 {
		t.Fatalf("len(Transactions) = %d, want 1", len(decoded.Transactions))
	}
	if decoded.Transactions[0].TxID != original.Transactions[0].TxID {
		t.Errorf("TxID = %q, want %q", decoded.Transactions[0].TxID, original.Transactions[0].TxID)
	}
}

func TestBlockDisconnectedRoundTrip(t *testing.T) {
	original := BlockDisconnected{
		Hash:   "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
		Height: 1,
		Time:   1231469665,
	}

	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	var decoded BlockDisconnected
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	if decoded.Hash != original.Hash {
		t.Errorf("Hash = %q, want %q", decoded.Hash, original.Hash)
	}
	if decoded.Height != original.Height {
		t.Errorf("Height = %d, want %d", decoded.Height, original.Height)
	}
}

func TestTxMempoolEventsRoundTrip(t *testing.T) {
	t.Run("added", func(t *testing.T) {
		original := TxMempoolAdded{
			TxID:  "abc123",
			Time:  1700000000,
			Size:  200,
			VSize: 200,
			Fee:   1000,
		}

		data, err := json.Marshal(original)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}

		var decoded TxMempoolAdded
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}

		if decoded.TxID != original.TxID {
			t.Errorf("TxID = %q, want %q", decoded.TxID, original.TxID)
		}
		if decoded.Fee != original.Fee {
			t.Errorf("Fee = %d, want %d", decoded.Fee, original.Fee)
		}
	})

	t.Run("removed", func(t *testing.T) {
		original := TxMempoolRemoved{TxID: "abc123"}

		data, err := json.Marshal(original)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}

		var decoded TxMempoolRemoved
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}

		if decoded.TxID != original.TxID {
			t.Errorf("TxID = %q, want %q", decoded.TxID, original.TxID)
		}
	})
}
