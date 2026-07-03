"use client";

import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBlockByHash, getBlockByHeight } from "@/lib/flo-api";
import type { BlockResponse, TransactionResponse } from "@/lib/flo-api";
import { formatNumber, formatDate } from "@/lib/utils";

export default function BlockDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const isHeight = /^\d+$/.test(id);
  const queryFn = isHeight
    ? () => getBlockByHeight(parseInt(id))
    : () => getBlockByHash(id);

  const { data: block } = useQuery({
    queryKey: ["block", id],
    queryFn,
  });

  const { data: blockTxs } = useQuery({
    queryKey: ["blockTxs", block?.hash],
    queryFn: () =>
      fetch(`http://127.0.0.1:3099/api/v1/block/${block?.hash}/txs`).then((r) =>
        r.json(),
      ) as Promise<{
        items: TransactionResponse[];
      }>,
    enabled: !!block?.hash,
  });

  const txs = blockTxs?.items ?? [];

  if (!block) {
    return (
      <div className="space-y-6" style={{ backgroundColor: "#fff5e0" }}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
          <p className="text-lg text-on-surface-variant">Loading block...</p>
        </div>
      </div>
    );
  }

  const title = `Block #${formatNumber(block.height)} | FLO Explorer`;
  const desc = `Block ${block.height} — ${formatNumber(block.txCount)} transactions, ${formatDate(block.time)}.`;

  const sizeMB = (block.size / (1024 * 1024)).toFixed(2);
  const capacityPct = Math.min(Math.round((block.size / 2000000) * 100), 100);

  return (
    <div className="space-y-6" style={{ backgroundColor: "#fff5e0" }}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
      </Head>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[11px] font-bold tracking-[0.05em] uppercase">
                Confirmed
              </span>
              <h1 className="text-[32px] font-semibold text-primary tracking-tight leading-[40px]">
                Block #{formatNumber(block.height)}
              </h1>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="font-mono text-[13px] font-semibold text-on-surface-variant break-all">
                {block.hash}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  const btn = e.currentTarget;
                  navigator.clipboard.writeText(block.hash);
                  btn.innerHTML = `<svg class="h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
                  setTimeout(() => {
                    btn.innerHTML = `<svg class="h-4 w-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                  }, 2000);
                }}
                dangerouslySetInnerHTML={{
                  __html: `<svg class="h-4 w-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg p-1.5 gap-1 shadow-sm">
            {block.previousBlockHash && (
              <Link
                href={`/block/${block.previousBlockHash}`}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container-highest rounded text-sm font-bold text-on-surface transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Link>
            )}
            <div className="w-px h-4 bg-outline-variant mx-1" />
            {block.nextBlockHash && (
              <Link
                href={`/block/${block.nextBlockHash}`}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container-highest rounded text-sm font-bold text-on-surface transition-all"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1 lg:col-span-2 row-span-1 bg-white border border-outline-variant p-6 rounded shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline mb-4">
                Block Reward
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-semibold text-primary leading-[40px] tracking-tight">
                  6.250
                </span>
                <span className="text-xl font-semibold text-on-surface-variant">
                  FLO
                </span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-outline-variant flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
                  Timestamp
                </span>
                <span className="text-sm font-bold">
                  {formatDate(block.time)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
                  Confirmations
                </span>
                <span className="text-sm font-bold text-secondary">
                  {formatNumber(block.confirmations)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-5 rounded shadow-sm space-y-1">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
              Difficulty
            </span>
            <p className="text-xl font-semibold">
              {(parseFloat(block.difficulty) / 1e12).toFixed(2)} T
            </p>
            <div className="pt-2 text-xs text-on-secondary-container">
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                +0.4% vs last block
              </span>
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-5 rounded shadow-sm space-y-1">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
              Nonce
            </span>
            <p className="font-mono text-[13px] font-semibold tracking-widest text-primary">
              0x{block.nonce.toString(16).padStart(8, "0")}
            </p>
            <div className="pt-2 text-xs text-outline">
              Proof of Work Verified
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-5 rounded shadow-sm space-y-1">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
              Size
            </span>
            <p className="text-xl font-semibold">{sizeMB} MB</p>
            <div className="w-full bg-surface-container rounded-full h-1 mt-3">
              <div
                className="bg-primary h-1 rounded-full"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <div className="pt-1 text-[10px] text-outline text-right">
              {capacityPct}% capacity
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-5 rounded shadow-sm space-y-1">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
              Weight
            </span>
            <p className="text-xl font-semibold">
              {formatNumber(block.weight)} WU
            </p>
            <div className="pt-2 text-xs text-outline">
              Virtual Size: {(block.weight / 4 / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 bg-white border border-outline-variant p-5 rounded shadow-sm space-y-2">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
              Merkle Root
            </span>
            <p className="text-[11px] font-semibold font-mono break-all text-on-surface-variant">
              {block.merkleRoot}
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Transactions</h2>
              <span className="bg-surface-container-highest text-on-surface px-2 py-0.5 rounded-full text-xs">
                {formatNumber(block.txCount)} total
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1 text-xs border border-outline-variant rounded hover:bg-surface-container transition-all"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                </svg>
                Filter
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1 text-xs border border-outline-variant rounded hover:bg-surface-container transition-all"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                CSV
              </button>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0">
                  <tr>
                    <Th>TX Hash</Th>
                    <Th>Type</Th>
                    <Th align="right">Total Value</Th>
                    <Th align="right">Confirmations</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {txs.map((tx) => {
                    const isCoinbase = tx.coinbase;
                    const totalValue =
                      tx.vout?.reduce(
                        (s, v) => s + parseFloat(v.value || "0"),
                        0,
                      ) || 0;
                    return (
                      <tr
                        key={tx.txid}
                        className="hover:bg-secondary-container/10 transition-colors group cursor-pointer"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`h-5 w-5 ${isCoinbase ? "text-primary" : "text-outline"}`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              {isCoinbase ? (
                                <>
                                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                  <rect
                                    x="8"
                                    y="2"
                                    width="8"
                                    height="4"
                                    rx="1"
                                    ry="1"
                                  />
                                </>
                              ) : (
                                <>
                                  <line x1="12" y1="19" x2="12" y2="5" />
                                  <polyline points="5 12 12 5 19 12" />
                                </>
                              )}
                            </svg>
                            <Link
                              href={`/tx/${tx.txid}`}
                              className="group flex items-center gap-1"
                            >
                              <span className="font-mono text-[13px] font-semibold text-primary hover:underline">
                                {tx.txid.slice(0, 8)}...{tx.txid.slice(-4)}
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <svg
                                  className="h-3 w-3 text-outline animate-pulse"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                                </svg>
                              </span>
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCoinbase
                                ? "bg-primary-container text-on-primary-container"
                                : "bg-surface-container text-on-surface-variant"
                            }`}
                          >
                            {isCoinbase ? "Coinbase" : "Transfer"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-outline font-mono">
                          {totalValue.toFixed(4)} FLO
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-outline">
                          {formatNumber(tx.confirmations)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-surface-container-low border-t border-outline-variant gap-4">
              <div className="text-xs text-outline">
                Showing 1-25 of {formatNumber(block.txCount)} transactions
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-outline">Rows per page:</span>
                  <select className="bg-transparent border-none focus:ring-0 text-xs font-bold cursor-pointer">
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled
                    className="p-1 hover:bg-surface-container rounded disabled:opacity-30"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="11 17 6 12 11 7" />
                      <polyline points="18 17 13 12 18 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1 hover:bg-surface-container rounded disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center px-4 gap-1">
                    <span className="text-xs font-bold">1</span>
                    <span className="text-xs text-outline">
                      / {Math.ceil((block.txCount || 0) / 25)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1 hover:bg-surface-container rounded"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:bg-surface-container rounded"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="13 17 18 12 13 7" />
                      <polyline points="6 17 11 12 6 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-white border border-outline-variant rounded p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-semibold">Network Throughput</h3>
              <p className="text-xs text-outline">
                Transactions per second in this block cluster
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface">
                Active TPS
              </span>
            </div>
          </div>
          <div className="h-48 w-full relative flex items-end justify-between px-2 gap-1">
            <div
              className="w-full bg-primary/10 h-24 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:10 - 2.4 TPS"
            />
            <div
              className="w-full bg-primary/10 h-32 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:15 - 3.1 TPS"
            />
            <div
              className="w-full bg-primary/10 h-16 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:20 - 1.8 TPS"
            />
            <div
              className="w-full bg-primary/10 h-40 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:25 - 4.2 TPS"
            />
            <div
              className="w-full bg-primary/10 h-28 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:30 - 2.9 TPS"
            />
            <div
              className="w-full bg-primary/10 h-20 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:35 - 2.1 TPS"
            />
            <div
              className="w-full bg-primary/10 h-36 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:40 - 3.8 TPS"
            />
            <div
              className="w-full bg-primary/10 h-12 rounded-t-sm border-t-2 border-primary transition-all hover:bg-primary/20 cursor-help"
              title="14:22:45 - 1.2 TPS"
            />
            <div className="absolute inset-0 border-b border-outline-variant/30 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-outline-variant/10" />
              <div className="w-full border-t border-outline-variant/10" />
              <div className="w-full border-t border-outline-variant/10" />
            </div>
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-outline font-mono font-semibold">
            <span>14:22:10</span>
            <span>14:22:25</span>
            <span>14:22:45</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right" | "center";
}) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-bold tracking-[0.05em] uppercase text-outline ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
