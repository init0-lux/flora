// FLO Explorer API client
// Stubbed data til the Go API is wired up

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────

export interface ChainInfo {
  bestBlockHash: string;
  bestBlockHeight: number;
  chain: string;
  difficulty: number;
  sizeOnDisk: number;
  version: string;
  subversion: string;
  protocolVersion: number;
  timeOffset: number;
  warnings: string;
  pruned: boolean;
}

export interface Block {
  hash: string;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string | null;
  nextblockhash: string | null;
  size: number;
  weight: number;
  confirmations: number;
  transactions: string[];
}

export interface Vin {
  txid: string | null;
  vout: number | null;
  coinbase: string | null;
  sequence: number;
  addresses: string[];
  value: string;
}

export interface Vout {
  value: string;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs: number;
    type: string;
    addresses: string[];
  };
  spent: boolean;
}

export interface Transaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  fee: string;
  vin: Vin[];
  vout: Vout[];
  blockhash: string;
  blockheight: number;
  confirmations: number;
  blocktime: number;
  time: number;
}

export interface AddressInfo {
  address: string;
  balance: string;
  unconfirmedBalance: string;
  totalReceived: string;
  totalSent: string;
  txCount: number;
  unconfirmedTxCount: number;
  utxoCount: number;
}

export interface Utxo {
  txid: string;
  vout: number;
  value: string;
  height: number;
  confirmations: number;
  scriptPubKey: string;
}

export interface MempoolInfo {
  size: number;
  bytes: number;
  usage: number;
  maxmempool: number;
  mempoolMinFee: number;
  minRelayTxFee: number;
  histogram: { feerate: number; count: number; bytes: number }[];
}

export interface SyncStatus {
  synced: boolean;
  currentBlock: number;
  highestBlock: number;
  progress: number;
  eta: string;
}

export interface NetworkStats {
  chainInfo: ChainInfo;
  mempoolInfo: MempoolInfo;
  peerCount: number;
  syncStatus: SyncStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Stub Data ────────────────────────────────────────────────────────

const STUB_CHAIN_INFO: ChainInfo = {
  bestBlockHash: "00000000000000000001a3a7e9b5c9b0f1e2d3c4b5a6f7e8d9c0b1a2b3c4d5e6",
  bestBlockHeight: 2886634,
  chain: "main",
  difficulty: 184576.321456,
  sizeOnDisk: 4294967296,
  version: "240100",
  subversion: "/FLO:M8.0.0/",
  protocolVersion: 70016,
  timeOffset: 0,
  warnings: "",
  pruned: false,
};

const STUB_BLOCK: Block = {
  hash: "00000000000000000001a3a7e9b5c9b0f1e2d3c4b5a6f7e8d9c0b1a2b3c4d5e6",
  height: 2886634,
  version: 536870912,
  versionHex: "20000000",
  merkleroot: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  time: 1719300000,
  mediantime: 1719299700,
  nonce: 2983746234,
  bits: "1a02b3c4",
  difficulty: 184576.321456,
  chainwork: "000000000000000000000000000000000000000000000000000001a2b3c4d5e6",
  nTx: 3,
  previousblockhash: "00000000000000000001a3a7e9b5c9b0f1e2d3c4b5a6f7e8d9c0b1a2b3c4d5e5",
  nextblockhash: "00000000000000000001a3a7e9b5c9b0f1e2d3c4b5a6f7e8d9c0b1a2b3c4d5e7",
  size: 2345,
  weight: 4567,
  confirmations: 1,
  transactions: [
    "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
  ],
};

const STUB_TX: Transaction = {
  txid: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  version: 1,
  size: 450,
  vsize: 450,
  weight: 1800,
  locktime: 0,
  fee: "0.00012500",
  vin: [
    {
      txid: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      vout: 0,
      coinbase: null,
      sequence: 4294967295,
      addresses: ["FAddress1Example"],
      value: "1.50000000",
    },
    {
      txid: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
      vout: 1,
      coinbase: null,
      sequence: 4294967295,
      addresses: ["FAddress2Example"],
      value: "2.30000000",
    },
  ],
  vout: [
    {
      value: "3.79987500",
      n: 0,
      scriptPubKey: {
        asm: "OP_DUP OP_HASH160 a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9 OP_EQUALVERIFY OP_CHECKSIG",
        hex: "76a914a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9ac88ac",
        reqSigs: 1,
        type: "pubkeyhash",
        addresses: ["FRecipientAddress"],
      },
      spent: false,
    },
    {
      value: "0.10000000",
      n: 1,
      scriptPubKey: {
        asm: "OP_DUP OP_HASH160 b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0 OP_EQUALVERIFY OP_CHECKSIG",
        hex: "76a914b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0ac88ac",
        reqSigs: 1,
        type: "pubkeyhash",
        addresses: ["FChangeAddress"],
      },
      spent: true,
    },
  ],
  blockhash: "00000000000000000001a3a7e9b5c9b0f1e2d3c4b5a6f7e8d9c0b1a2b3c4d5e6",
  blockheight: 2886634,
  confirmations: 1,
  blocktime: 1719300000,
  time: 1719300000,
};

const STUB_ADDRESS: AddressInfo = {
  address: "F1z2x3c4v5b6n7m8a9s0d1f2g3h4j5k6l7z8x9c0",
  balance: "1250.50000000",
  unconfirmedBalance: "0.00000000",
  totalReceived: "50000.75000000",
  totalSent: "48750.25000000",
  txCount: 1432,
  unconfirmedTxCount: 0,
  utxoCount: 47,
};

const STUB_UTXOS: Utxo[] = Array.from({ length: 5 }, (_, i) => ({
  txid: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a${i}`,
  vout: i,
  value: `${(Math.random() * 100).toFixed(8)}`,
  height: 2886600 + i,
  confirmations: 34 - i,
  scriptPubKey: "76a914a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9ac88ac",
}));

const STUB_MEMPOOL: MempoolInfo = {
  size: 2345,
  bytes: 1250000,
  usage: 3456789,
  maxmempool: 300000000,
  mempoolMinFee: 0.00001,
  minRelayTxFee: 0.00001,
  histogram: [
    { feerate: 0.00001, count: 500, bytes: 250000 },
    { feerate: 0.00002, count: 400, bytes: 200000 },
    { feerate: 0.00005, count: 300, bytes: 150000 },
    { feerate: 0.0001, count: 200, bytes: 100000 },
    { feerate: 0.0002, count: 100, bytes: 50000 },
  ],
};

const STUB_SYNC: SyncStatus = {
  synced: true,
  currentBlock: 2886634,
  highestBlock: 2886634,
  progress: 1,
  eta: "0s",
};

const STUB_TXS: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
  ...STUB_TX,
  txid: `${i}${STUB_TX.txid.slice(1)}`,
  hash: `${i}${STUB_TX.txid.slice(1)}`,
  blockheight: STUB_TX.blockheight - i,
  time: STUB_TX.time - i * 600,
  fee: `${(0.0001 + Math.random() * 0.001).toFixed(8)}`,
  value: (Math.random() * 100).toFixed(8),
}));

const STUB_BLOCKS: Block[] = Array.from({ length: 10 }, (_, i) => ({
  ...STUB_BLOCK,
  hash: `${i}${STUB_BLOCK.hash.slice(1)}`,
  height: STUB_BLOCK.height - i,
  time: STUB_BLOCK.time - i * 600,
  nTx: Math.floor(Math.random() * 10) + 1,
}));

// ─── API Calls ────────────────────────────────────────────────────────

// Simulated delay
async function stub<T>(data: T, delayMs = 300): Promise<T> {
  await new Promise((r) => setTimeout(r, delayMs));
  return data;
}

export async function getChainInfo(): Promise<ChainInfo> {
  return stub(STUB_CHAIN_INFO);
}

export async function getBlockByHash(hash: string): Promise<Block> {
  return stub({ ...STUB_BLOCK, hash });
}

export async function getBlockByHeight(height: number): Promise<Block> {
  return stub({ ...STUB_BLOCK, height });
}

export async function getRecentBlocks(count = 10): Promise<Block[]> {
  return stub(STUB_BLOCKS.slice(0, count));
}

export async function getTransaction(txid: string): Promise<Transaction> {
  return stub({ ...STUB_TX, txid });
}

export async function getRecentTransactions(count = 10): Promise<Transaction[]> {
  return stub(STUB_TXS.slice(0, count));
}

export async function getAddressInfo(address: string): Promise<AddressInfo> {
  return stub({ ...STUB_ADDRESS, address });
}

export async function getAddressTransactions(
  address: string,
  page = 1,
  pageSize = 25
): Promise<PaginatedResponse<Transaction>> {
  return stub({
    items: STUB_TXS,
    totalCount: STUB_ADDRESS.txCount,
    page,
    pageSize,
    hasMore: page * pageSize < STUB_ADDRESS.txCount,
  });
}

export async function getAddressUtxos(address: string): Promise<Utxo[]> {
  return stub(STUB_UTXOS);
}

export async function getMempoolInfo(): Promise<MempoolInfo> {
  return stub(STUB_MEMPOOL);
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return stub(STUB_SYNC);
}

export async function getNetworkStats(): Promise<NetworkStats> {
  return stub({
    chainInfo: STUB_CHAIN_INFO,
    mempoolInfo: STUB_MEMPOOL,
    peerCount: 42,
    syncStatus: STUB_SYNC,
  });
}

export async function searchQuery(q: string): Promise<{
  type: "block" | "transaction" | "address" | "unknown";
  value: string;
}> {
  const trimmed = q.trim();
  if (/^\d+$/.test(trimmed)) return stub({ type: "block" as const, value: trimmed });
  if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed))
    return stub({ type: "transaction" as const, value: trimmed });
  if (/^[Ff][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed))
    return stub({ type: "address" as const, value: trimmed });
  return stub({ type: "unknown" as const, value: trimmed });
}
