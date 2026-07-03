package writer

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/init0/flora/packages/db"
	"github.com/init0/flora/packages/db/repository"
	"github.com/init0/flora/packages/eventbus"
	"github.com/init0/flora/packages/models"
)

// Writer consumes events from NATS and maintains the serving tables in PostgreSQL.
type Writer struct {
	pool *pgxpool.Pool
	sub  eventbus.Subscriber
}

func New(pool *pgxpool.Pool, sub eventbus.Subscriber) *Writer {
	return &Writer{pool: pool, sub: sub}
}

// Run subscribes to all event subjects and blocks until ctx is cancelled.
func (w *Writer) Run(ctx context.Context) error {
	subs := []struct {
		subject string
		durable string
		handler func(context.Context, *eventbus.Message) error
	}{
		{eventbus.SubjectBlockConnected, "writer-block-connected", w.handleBlockConnected},
		{eventbus.SubjectBlockDisconnected, "writer-block-disconnected", w.handleBlockDisconnected},
		{eventbus.SubjectTxMempoolAdded, "writer-mempool-added", w.handleMempoolAdded},
		{eventbus.SubjectTxMempoolRemoved, "writer-mempool-removed", w.handleMempoolRemoved},
	}

	for _, s := range subs {
		subject, durable, handler := s.subject, s.durable, s.handler
		if err := w.sub.Subscribe(ctx, subject, durable, func(msg *eventbus.Message) error {
			return handler(ctx, msg)
		}); err != nil {
			return fmt.Errorf("subscribe %q: %w", subject, err)
		}
	}

	<-ctx.Done()
	return ctx.Err()
}

// handleBlockConnected processes a block.connected event.
func (w *Writer) handleBlockConnected(ctx context.Context, msg *eventbus.Message) error {
	var event models.BlockConnected
	if err := json.Unmarshal(msg.Data, &event); err != nil {
		return fmt.Errorf("unmarshal block.connected: %w", err)
	}

	return db.WithTx(ctx, w.pool, func(q *repository.Queries) error {
		if err := q.InsertBlock(ctx, repository.InsertBlockParams{
			Hash:       event.Hash,
			Height:     event.Height,
			PrevHash:   event.PrevHash,
			MerkleRoot: event.MerkleRoot,
			Time:       event.Time,
			Bits:       event.Bits,
			Nonce:      event.Nonce,
			Size:       event.Size,
			Weight:     event.Weight,
			Version:    event.Version,
			Difficulty: event.Difficulty,
			Chainwork:  event.Chainwork,
			TxCount:    event.TxCount,
		}); err != nil {
			return fmt.Errorf("insert block: %w", err)
		}

		for _, tx := range event.Transactions {
			coinbase := len(tx.Vin) == 1 && tx.Vin[0].Coinbase != ""
			if err := q.InsertTx(ctx, repository.InsertTxParams{
				Txid:        tx.TxID,
				Hash:        tx.Hash,
				BlockHash:   event.Hash,
				BlockHeight: event.Height,
				BlockTime:   event.Time,
				Size:        tx.Size,
				Vsize:       tx.VSize,
				Version:     1,
				Locktime:    0,
				Coinbase:    coinbase,
			}); err != nil {
				return fmt.Errorf("insert tx %s: %w", tx.TxID, err)
			}

			for _, vin := range tx.Vin {
				if err := q.InsertVin(ctx, repository.InsertVinParams{
					Txid:        tx.TxID,
					Vout:        vin.Vout,
					Coinbase:    vin.Coinbase,
					PrevTxid:    vin.TxID,
					PrevVout:    vin.Vout,
					ScriptSig:   vin.ScriptSig,
					Sequence:    vin.Sequence,
					Txinwitness: []string{},
				}); err != nil {
					return fmt.Errorf("insert vin for %s: %w", tx.TxID, err)
				}
			}

			for _, vout := range tx.Vout {
				if err := q.InsertVout(ctx, repository.InsertVoutParams{
					Txid:             tx.TxID,
					N:                vout.N,
					Value:            vout.Value,
					ScriptPubKeyHex:  vout.ScriptPubKeyHex,
					ScriptPubKeyType: vout.ScriptPubKeyType,
					Addresses:        vout.Addresses,
				}); err != nil {
					return fmt.Errorf("insert vout for %s: %w", tx.TxID, err)
				}

				for _, address := range vout.Addresses {
					if err := q.IncrementAddressBalance(ctx, repository.IncrementAddressBalanceParams{
						Address:  address,
						Balance:  vout.Value,
						Received: vout.Value,
						Sent:     0,
					}); err != nil {
						return fmt.Errorf("update balance for %s: %w", address, err)
					}

					if err := q.InsertAddressTx(ctx, repository.InsertAddressTxParams{
						Address:     address,
						Txid:        tx.TxID,
						BlockHeight: event.Height,
						BlockTime:   event.Time,
						TxType:      "received",
					}); err != nil {
						return fmt.Errorf("insert address tx %s/%s: %w", address, tx.TxID, err)
					}

					if err := q.InsertUtxo(ctx, repository.InsertUtxoParams{
						Txid:            tx.TxID,
						Vout:            vout.N,
						Address:         address,
						Value:           vout.Value,
						ScriptPubKeyHex: vout.ScriptPubKeyHex,
						Coinbase:        coinbase,
						BlockHeight:     event.Height,
					}); err != nil {
						return fmt.Errorf("insert utxo %s/%d: %w", tx.TxID, vout.N, err)
					}
				}
			}

			if !coinbase {
				for _, vin := range tx.Vin {
					if vin.TxID == "" {
						continue
					}
					if err := q.DeleteUtxo(ctx, repository.DeleteUtxoParams{
						Txid: vin.TxID,
						Vout: vin.Vout,
					}); err != nil {
						return fmt.Errorf("delete utxo %s/%d: %w", vin.TxID, vin.Vout, err)
					}
				}
			}
		}

		if err := q.SetChainState(ctx, repository.SetChainStateParams{
			Key:   "last_block_height",
			Value: fmt.Sprintf("%d", event.Height),
		}); err != nil {
			return fmt.Errorf("set chain state: %w", err)
		}

		return nil
	})
}

// handleBlockDisconnected removes a block and cascades.
func (w *Writer) handleBlockDisconnected(ctx context.Context, msg *eventbus.Message) error {
	var event models.BlockDisconnected
	if err := json.Unmarshal(msg.Data, &event); err != nil {
		return fmt.Errorf("unmarshal block.disconnected: %w", err)
	}

	return db.WithTx(ctx, w.pool, func(q *repository.Queries) error {
		if err := q.DeleteBlock(ctx, event.Hash); err != nil {
			return fmt.Errorf("delete block %s: %w", event.Hash, err)
		}

		return q.SetChainState(ctx, repository.SetChainStateParams{
			Key:   "last_block_height",
			Value: fmt.Sprintf("%d", event.Height-1),
		})
	})
}

// handleMempoolAdded processes a tx.mempool.added event.
func (w *Writer) handleMempoolAdded(ctx context.Context, msg *eventbus.Message) error {
	var event models.TxMempoolAdded
	if err := json.Unmarshal(msg.Data, &event); err != nil {
		return fmt.Errorf("unmarshal tx.mempool.added: %w", err)
	}

	return db.WithTx(ctx, w.pool, func(q *repository.Queries) error {
		feePerByte := int64(0)
		if event.VSize > 0 {
			feePerByte = event.Fee / event.VSize
		}
		return q.InsertMempoolTx(ctx, repository.InsertMempoolTxParams{
			Txid:       event.TxID,
			Time:       event.Time,
			Size:       event.Size,
			Vsize:      event.VSize,
			Fee:        event.Fee,
			FeePerByte: feePerByte,
		})
	})
}

// handleMempoolRemoved processes a tx.mempool.removed event.
func (w *Writer) handleMempoolRemoved(ctx context.Context, msg *eventbus.Message) error {
	var event models.TxMempoolRemoved
	if err := json.Unmarshal(msg.Data, &event); err != nil {
		return fmt.Errorf("unmarshal tx.mempool.removed: %w", err)
	}

	return db.WithTx(ctx, w.pool, func(q *repository.Queries) error {
		return q.DeleteMempoolTx(ctx, event.TxID)
	})
}
