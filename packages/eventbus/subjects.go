package eventbus

// Subject constants for the indexing pipeline event contracts.
const (
	SubjectBlockConnected    = "block.connected"
	SubjectBlockDisconnected = "block.disconnected"
	SubjectTxConfirmed       = "tx.confirmed"
	SubjectTxMempoolAdded    = "tx.mempool.added"
	SubjectTxMempoolRemoved  = "tx.mempool.removed"
)
