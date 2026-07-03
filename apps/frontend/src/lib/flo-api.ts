// FLO Explorer API client — fetches from the Go Fiber backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ─── Types (aligned with Go API responses) ────────────────────────────

export interface BlockResponse {
  hash: string;
  height: number;
  time: number;
  size: number;
  weight: number;
  version: number;
  merkleRoot: string;
  bits: string;
  nonce: number;
  difficulty: string;
  chainwork: string;
  previousBlockHash: string;
  nextBlockHash?: string;
  txCount: number;
  confirmations: number;
  transactions?: string[];
}

export interface TransactionResponse {
  txid: string;
  hash: string;
  size: number;
  vsize: number;
  version: number;
  locktime: number;
  blockHash: string;
  blockHeight: number;
  blockTime: number;
  confirmations: number;
  coinbase: boolean;
  vin: VinResponse[];
  vout: VoutResponse[];
}

export interface VinResponse {
  coinbase?: string;
  txid?: string;
  vout?: number;
  scriptSig?: string;
  sequence: number;
}

export interface VoutResponse {
  value: string;
  n: number;
  scriptPubKeyHex?: string;
  scriptPubKeyType?: string;
  addresses?: string[];
}

export interface AddressResponse {
  address: string;
  balance: string;
  totalReceived: string;
  totalSent: string;
  txs: number;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
}

export interface UtxoResponse {
  txid: string;
  vout: number;
  value: string;
  height: number;
  confirmations: number;
  address?: string;
  scriptPubKeyHex?: string;
  coinbase: boolean;
}

export interface MempoolTxResponse {
  txid: string;
  time: number;
  size: number;
  fee: string;
  feePerByte: string;
}

export interface NetworkResponse {
  chainInfo: {
    chain: string;
    blocks: number;
    headers: number;
    bestBlockHash: string;
    difficulty: number;
    subVersion: string;
    connections: number;
  };
  mempool: {
    size: number;
    bytes: number;
  };
  peerCount: number;
  bestBlock: string;
  bestHeight: number;
  synced: boolean;
}

export interface SearchResult {
  type: "block" | "transaction" | "address" | "unknown";
  hash?: string;
  height?: number;
  txid?: string;
  address?: string;
}

export interface PaginatedItems<T> {
  page: number;
  itemsOnPage: number;
  items: T[];
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 5 } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Chain / Network ──────────────────────────────────────────────────

export function getChainInfo(): Promise<NetworkResponse> {
  return fetchJSON("/api/v1/network");
}

export function getNetworkStats(): Promise<NetworkResponse> {
  return fetchJSON("/api/v1/network");
}

export function getSyncStatus(): Promise<{
  synced: boolean;
  currentBlock: number;
  highestBlock: number;
}> {
  return fetchJSON<NetworkResponse>("/api/v1/network").then((n) => ({
    synced: n.synced,
    currentBlock: n.bestHeight,
    highestBlock: n.chainInfo.headers,
  }));
}

// ─── Blocks ───────────────────────────────────────────────────────────

export function getBlockByHash(hash: string): Promise<BlockResponse> {
  return fetchJSON(`/api/v1/block/${hash}`);
}

export function getBlockByHeight(height: number): Promise<BlockResponse> {
  return fetchJSON(`/api/v1/block-height/${height}`);
}

export async function getRecentBlocks(count = 10): Promise<BlockResponse[]> {
  const res = await fetchJSON<PaginatedItems<BlockResponse>>(
    `/api/v1/blocks?limit=${count}`,
  );
  return res.items;
}

// ─── Transactions ─────────────────────────────────────────────────────

export function getTransaction(txid: string): Promise<TransactionResponse> {
  return fetchJSON(`/api/v1/tx/${txid}`);
}

export async function getRecentTransactions(
  count = 10,
): Promise<TransactionResponse[]> {
  const res = await fetchJSON<{ items: TransactionResponse[] }>(
    `/api/v1/txs?limit=${count}`,
  );
  return res.items;
}

// ─── Addresses ────────────────────────────────────────────────────────

export function getAddressInfo(address: string): Promise<AddressResponse> {
  return fetchJSON(`/api/v1/address/${address}`);
}

export async function getAddressTransactions(
  address: string,
  page = 1,
  pageSize = 25,
): Promise<{
  items: TransactionResponse[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}> {
  const res = await fetchJSON<PaginatedItems<TransactionResponse>>(
    `/api/v1/address/${address}/txs?page=${page}&limit=${pageSize}`,
  );
  return {
    items: res.items,
    totalCount: res.itemsOnPage,
    page,
    hasMore: false,
  };
}

export function getAddressUtxos(address: string): Promise<UtxoResponse[]> {
  return fetchJSON(`/api/v1/utxo/${address}`);
}

// ─── Mempool ──────────────────────────────────────────────────────────

export async function getMempoolInfo(): Promise<{
  size: number;
  bytes: number;
}> {
  const net = await fetchJSON<NetworkResponse>("/api/v1/network");
  return net.mempool;
}

export async function getMempoolTxs(): Promise<MempoolTxResponse[]> {
  const res =
    await fetchJSON<PaginatedItems<MempoolTxResponse>>("/api/v1/mempool");
  return res.items;
}

// ─── Search ───────────────────────────────────────────────────────────

export async function searchQuery(q: string): Promise<SearchResult> {
  const trimmed = q.trim();
  if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
    // Try block hash first, then txid
    const block = await getBlockByHash(trimmed).catch(() => null);
    if (block) return { type: "block", hash: block.hash, height: block.height };
    const tx = await getTransaction(trimmed).catch(() => null);
    if (tx) return { type: "transaction", txid: tx.txid };
  }
  if (/^\d+$/.test(trimmed)) {
    try {
      const block = await getBlockByHeight(parseInt(trimmed, 10));
      return { type: "block", hash: block.hash, height: block.height };
    } catch {
      /* fall through */
    }
  }
  if (/^[Ff][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed)) {
    try {
      await getAddressInfo(trimmed);
      return { type: "address", address: trimmed };
    } catch {
      /* fall through */
    }
  }
  return { type: "unknown" };
}
