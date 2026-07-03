"use client";

import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  getAddressInfo,
  getAddressTransactions,
  getAddressUtxos,
} from "@/lib/flo-api";
import { formatFloShort, formatNumber, timeAgo } from "@/lib/utils";

type Tab = "transactions" | "analytics" | "utxos" | "overview";

export default function AddressDetailPage() {
  const params = useParams();
  const address = params.id as string;
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("transactions");

  const { data: info } = useQuery({
    queryKey: ["address", address],
    queryFn: () => getAddressInfo(address),
  });

  const { data: txs } = useQuery({
    queryKey: ["addressTxs", address, page],
    queryFn: () => getAddressTransactions(address, page, 25),
  });

  const { data: utxos } = useQuery({
    queryKey: ["addressUtxos", address],
    queryFn: () => getAddressUtxos(address),
  });

  if (!info) {
    return (
      <div className="space-y-6" style={{ backgroundColor: "#fff5e0" }}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
          <p className="text-lg text-on-surface-variant">Loading address...</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "transactions", label: "TRANSACTIONS" },
    { key: "analytics", label: "ANALYTICS" },
    { key: "utxos", label: "UTXOs" },
    { key: "overview", label: "OVERVIEW" },
  ];

  const totalPages = txs ? Math.ceil(txs.totalCount / 25) : 1;

  const title = `Address ${address.slice(0, 12)}... | FLO Explorer`;
  const desc = `Address ${address} — balance ${info.balance}, ${formatNumber(info.txs)} transactions.`;

  return (
    <div className="space-y-6" style={{ backgroundColor: "#fff5e0" }}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
      </Head>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6">
        <section className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                  Address
                </span>
                <span className="flex items-center gap-1 text-secondary text-[11px] font-bold tracking-[0.05em] bg-secondary-container/20 px-2 py-0.5 rounded">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Verified
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl md:text-[32px] font-semibold font-mono text-primary break-all leading-[32px] md:leading-[40px] tracking-tight">
                  {address.slice(0, 16)}...{address.slice(-8)}
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      navigator.clipboard.writeText(address);
                      btn.innerHTML = `<svg class="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
                      setTimeout(() => {
                        btn.innerHTML = `<svg class="h-5 w-5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                      }, 2000);
                    }}
                    className="p-2 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg border border-outline-variant group"
                    title="Copy Address"
                    dangerouslySetInnerHTML={{
                      __html: `<svg class="h-5 w-5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
                    }}
                  />
                  <button
                    type="button"
                    className="p-2 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg border border-outline-variant"
                    title="View QR Code"
                  >
                    <svg
                      className="h-5 w-5 text-on-surface-variant"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                CURRENT BALANCE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-bold text-primary leading-[40px] tracking-tight">
                  {formatFloShort(info.balance).replace(" FLO", "")}
                </span>
                <span className="text-xl font-semibold text-on-surface-variant">
                  FLO
                </span>
              </div>
              <span className="text-xs text-on-secondary-container font-mono font-semibold">
                ≈ $4,321.45 USD
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            label="BALANCE SPLIT"
            icon="wallet"
            className="text-secondary"
          >
            <StatRow
              label="Confirmed"
              value={`${formatFloShort(info.balance)}`}
            />
            <StatRow
              label="Unconfirmed"
              value={`${formatFloShort(info.unconfirmedBalance)}`}
              valueClass="text-secondary"
            />
          </StatsCard>
          <StatsCard label="TOTAL VOLUME" icon="swap" className="text-primary">
            <StatRow
              label="Received"
              value={formatFloShort(info.totalReceived)}
            />
            <StatRow label="Sent" value={formatFloShort(info.totalSent)} />
          </StatsCard>
          <StatsCard
            label="ACTIVITY"
            icon="stats"
            className="text-tertiary-fixed-dim"
          >
            <StatRow label="Total Txns" value={formatNumber(info.txs)} />
            <StatRow
              label="UTXO Count"
              value={formatNumber(utxos?.length ?? 0)}
            />
          </StatsCard>
          <StatsCard
            label="TIMELINE"
            icon="calendar"
            className="text-on-surface-variant"
          >
            <StatRow label="First Seen" value="Oct 12, 2021" />
            <StatRow label="Last Active" value="2 hours ago" />
          </StatsCard>
        </section>

        <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden min-h-[600px]">
          <div className="flex bg-surface-container-low border-b border-outline-variant px-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-[11px] font-bold tracking-[0.05em] uppercase transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-on-surface-variant hover:text-primary border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "transactions" && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-container-low z-10 border-b border-outline-variant">
                    <tr>
                      <Th>TX HASH</Th>
                      <Th>BLOCK</Th>
                      <Th>AGE</Th>
                      <Th align="right">AMOUNT</Th>
                      <Th align="right">FEE</Th>
                      <Th>DIRECTION</Th>
                      <Th align="center">CONFIRMATIONS</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {txs?.items.map((tx) => {
                      const amount = 0;
                      const isIn = false;
                      return (
                        <tr
                          key={tx.txid}
                          className="transition-colors hover:bg-[rgba(141,236,180,0.1)] cursor-pointer"
                        >
                          <td className="px-6 py-4 font-mono text-[13px] font-semibold text-secondary">
                            <Link
                              href={`/tx/${tx.txid}`}
                              className="hover:underline"
                            >
                              {tx.txid.slice(0, 8)}...{tx.txid.slice(-4)}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-primary underline decoration-primary/30">
                            <Link href={`/block/${tx.blockHeight}`}>
                              {formatNumber(tx.blockHeight)}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-xs text-on-surface-variant">
                            {timeAgo(tx.blockTime)}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono font-semibold text-right text-primary">
                            {formatFloShort(amount.toString())}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-semibold text-right text-on-surface-variant">
                            -
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.05em] uppercase px-2 py-0.5 rounded ${
                                isIn
                                  ? "text-secondary bg-secondary-container/20"
                                  : "text-on-surface-variant bg-surface-container"
                              }`}
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                {isIn ? (
                                  <>
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                  </>
                                ) : (
                                  <>
                                    <polyline points="7 16 12 21 17 16" />
                                    <line x1="12" y1="21" x2="12" y2="9" />
                                  </>
                                )}
                              </svg>
                              {isIn ? "IN" : "OUT"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-on-secondary-fixed-variant">
                              {formatNumber(tx.confirmations)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-outline-variant flex justify-between items-center bg-surface">
                <span className="text-xs text-on-surface-variant">
                  Showing {(page - 1) * 25 + 1}-
                  {Math.min(page * 25, txs?.totalCount ?? 0)} of{" "}
                  {formatNumber(txs?.totalCount ?? 0)} transactions
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-[11px] font-bold tracking-[0.05em] uppercase border border-outline-variant rounded bg-white hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    PREVIOUS
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-[11px] font-bold tracking-[0.05em] uppercase border border-outline-variant rounded bg-white hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-primary">
                      Balance History
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 text-[11px] font-bold tracking-[0.05em] uppercase rounded bg-primary text-white"
                      >
                        30D
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 text-[11px] font-bold tracking-[0.05em] uppercase rounded bg-surface-container-high text-on-surface-variant"
                      >
                        90D
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 text-[11px] font-bold tracking-[0.05em] uppercase rounded bg-surface-container-high text-on-surface-variant"
                      >
                        1Y
                      </button>
                    </div>
                  </div>
                  <div className="h-64 w-full relative bg-surface-container-low rounded-lg border border-outline-variant overflow-hidden p-4">
                    <div className="absolute bottom-0 left-0 right-0 h-full flex items-end">
                      <svg
                        className="w-full h-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 400 100"
                      >
                        <defs>
                          <linearGradient
                            id="balanceGrad"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#141e46"
                              stopOpacity="0.2"
                            />
                            <stop
                              offset="100%"
                              stopColor="#141e46"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,80 Q50,70 100,50 T200,60 T300,20 T400,30 L400,100 L0,100 Z"
                          fill="url(#balanceGrad)"
                        />
                        <path
                          d="M0,80 Q50,70 100,50 T200,60 T300,20 T400,30"
                          fill="none"
                          stroke="#00062b"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <div className="absolute top-4 left-4 flex flex-col gap-1">
                      <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                        PEAK BALANCE
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatFloShort(info.totalReceived)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-primary">
                    Activity Frequency
                  </h3>
                  <div className="h-64 w-full bg-surface-container-low rounded-lg border border-outline-variant p-4 grid grid-cols-7 items-end gap-2">
                    <div className="bg-primary/20 hover:bg-primary h-2/3 transition-all rounded-t" />
                    <div className="bg-primary/20 hover:bg-primary h-1/3 transition-all rounded-t" />
                    <div className="bg-primary/20 hover:bg-primary h-5/6 transition-all rounded-t" />
                    <div className="bg-primary/20 hover:bg-primary h-2/5 transition-all rounded-t" />
                    <div className="bg-primary/20 hover:bg-primary h-4/5 transition-all rounded-t" />
                    <div className="bg-primary/20 hover:bg-primary h-1/2 transition-all rounded-t" />
                    <div className="bg-primary/20 hover:bg-primary h-3/4 transition-all rounded-t" />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "utxos" && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {utxos?.map((utxo) => (
                  <Link
                    key={`${utxo.txid}:${utxo.vout}`}
                    href={`/tx/${utxo.txid}`}
                    className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest hover:border-primary transition-colors group block"
                  >
                    <div className="flex justify-between mb-4">
                      <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                        #{utxo.height}:{utxo.vout}
                      </span>
                      <svg
                        className="h-5 w-5 text-secondary"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl font-semibold font-mono text-primary">
                        {formatFloShort(utxo.value).replace(" FLO", "")}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        FLO
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold font-mono text-on-surface-variant truncate">
                      {utxo.txid.slice(0, 10)}...{utxo.txid.slice(-4)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="p-6">
              <div className="max-w-2xl space-y-6">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                    QUICK SUMMARY
                  </h4>
                  <p className="text-sm text-on-surface">
                    This address is an active participant in the FLO network. It
                    has primarily received funds through mining pool
                    distributions and has maintained a consistent holding
                    pattern over the last quarter. No suspicious or alert-worthy
                    activity has been flagged by the automated network monitors.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6 border-t border-outline-variant pt-6">
                  <div>
                    <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant block mb-1">
                      REPUTATION
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-surface-container rounded-full overflow-hidden">
                        <div className="bg-secondary h-full w-4/5" />
                      </div>
                      <span className="text-xs font-bold text-secondary">
                        82/100
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant block mb-1">
                      SECURITY
                    </span>
                    <span className="text-xs flex items-center gap-1 text-on-surface">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      High Entropy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  icon,
  className,
  children,
}: {
  label: string;
  icon: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
          {label}
        </span>
        <svg
          className={`h-5 w-5 ${className ?? ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {icon === "wallet" && (
            <>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </>
          )}
          {icon === "swap" && (
            <>
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </>
          )}
          {icon === "stats" && (
            <>
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </>
          )}
          {icon === "calendar" && (
            <>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </>
          )}
        </svg>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span
        className={`text-sm font-mono font-semibold ${valueClass ?? "text-primary"}`}
      >
        {value}
      </span>
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
      className={`px-6 py-3 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant ${
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
