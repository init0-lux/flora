"use client";

import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Moon,
  CheckCircle,
  LogIn,
  LogOut,
  Database,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { getTransaction } from "@/lib/flo-api";
import { formatFloShort, formatDate, formatNumber } from "@/lib/utils";

export default function TransactionDetailPage() {
  const params = useParams();
  const txid = params.id as string;

  const { data: tx } = useQuery({
    queryKey: ["transaction", txid],
    queryFn: () => getTransaction(txid),
  });

  if (!tx) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#fff5e0" }}
      >
        <main className="flex-grow w-full max-w-[1600px] mx-auto px-8 py-8">
          <p className="text-lg text-on-surface-variant">
            Loading transaction...
          </p>
        </main>
      </div>
    );
  }

  const totalInput = 0; // input values not available from API
  const totalOutput = tx.vout.reduce(
    (sum, vout) => sum + parseFloat(vout.value),
    0,
  );
  const fee = 0; // tx fee not available from API directly — compute from input - output when inputs have values
  const FLO_TO_SAT = 100_000_000;
  const feeSats = fee * FLO_TO_SAT;
  const feeRate = tx.vsize > 0 ? (feeSats / tx.vsize).toFixed(1) : "0";

  const title = `Transaction ${tx.txid.slice(0, 16)}... | FLO Explorer`;
  const desc = `Transaction with ${tx.vin.length} inputs and ${tx.vout.length} outputs, ${formatNumber(tx.confirmations)} confirmations.`;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#fff5e0" }}
    >
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
      </Head>
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-8 py-8 space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                Transaction Hash
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold font-mono text-primary break-all">
                  {tx.txid}
                </span>
                <button
                  type="button"
                  className="p-1 hover:bg-secondary-container/20 rounded transition-all"
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    navigator.clipboard.writeText(tx.txid);
                    btn.innerHTML = `<svg class="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
                    setTimeout(() => {
                      btn.innerHTML = `<svg class="h-5 w-5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                    }, 2000);
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `<svg class="h-5 w-5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container/20 text-secondary text-[11px] font-bold tracking-[0.05em] uppercase rounded-full border border-secondary/20">
                <CheckCircle className="h-4 w-4" />
                CONFIRMED
              </span>
              <span className="text-xs text-on-surface-variant font-mono font-semibold">
                {formatNumber(tx.confirmations)} Confirmations
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryTile label="FEES">
            <div className="text-xl font-semibold font-mono text-primary">
              {tx.coinbase ? "—" : "—"}
            </div>
            <div className="text-xs text-outline">
              {tx.coinbase ? "Coinbase" : "—"}
            </div>
          </SummaryTile>
          <SummaryTile label="SIZE">
            <div className="text-xl font-semibold font-mono text-primary">
              {tx.size} B
            </div>
          </SummaryTile>
          <SummaryTile label="VSIZE">
            <div className="text-xl font-semibold font-mono text-primary">
              {tx.vsize} vB
            </div>
          </SummaryTile>
          <SummaryTile label="TIMESTAMP">
            <div className="text-sm font-bold text-primary">
              {formatDate(tx.blockTime).split(",")[0]}
            </div>
            <div className="text-xs text-outline">
              {formatDate(tx.blockTime).split(",")[1]?.trim()}
            </div>
          </SummaryTile>
          <SummaryTile label="INCLUDED IN BLOCK" className="lg:col-span-2">
            <div className="flex items-center justify-between mt-2">
              <Link
                href={`/block/${tx.blockHeight}`}
                className="text-xl font-semibold font-mono text-secondary"
              >
                #{formatNumber(tx.blockHeight)}
              </Link>
              <ExternalLink className="h-5 w-5 text-outline" />
            </div>
          </SummaryTile>
        </section>

        <section className="bg-white border border-outline-variant rounded-lg p-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-col items-end gap-2">
              <div className="w-full h-12 bg-surface-container-low border border-outline-variant rounded flex items-center justify-center text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                INPUT ({tx.vin.length})
              </div>
              <div className="text-xl font-semibold font-mono">
                {formatFloShort(totalInput.toString())}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 px-8">
              <div className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline">
                Network Fee
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <div className="text-xs font-mono font-semibold text-on-surface-variant">
                {tx.coinbase ? "0.0000 FLO" : "—"}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-start gap-2">
              <div className="w-full h-12 bg-secondary-container/10 border border-secondary/20 rounded flex items-center justify-center text-[11px] font-bold tracking-[0.05em] uppercase text-secondary">
                OUTPUTS ({tx.vout.length})
              </div>
              <div className="text-xl font-semibold font-mono">
                {formatFloShort(totalOutput.toString())}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h2 className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                INPUTS
              </h2>
              <span className="text-xs text-outline">
                {tx.coinbase ? "Newly Minted" : "—"}
              </span>
            </div>
            <div className="space-y-3">
              {tx.vin.map((vin, i) => (
                <div
                  key={i}
                  className="bg-white border border-outline-variant p-4 rounded-lg space-y-3 hover:shadow-sm transition-all border-l-4 border-l-outline"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-xs text-outline font-mono font-semibold">
                        #{i}
                      </span>
                      <div className="text-sm font-mono font-semibold text-secondary hover:underline cursor-pointer">
                        {vin.coinbase ? (
                          <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                            Coinbase
                          </span>
                        ) : vin.txid ? (
                          <Link href={`/address/${vin.txid}`}>
                            {vin.txid.slice(0, 12)}...
                          </Link>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold">
                      {formatFloShort(vin.txid ? "0" : vin.coinbase || "0")}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/50">
                    <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline block mb-2">
                      UNLOCKING SCRIPT (SIG)
                    </span>
                    <div className="text-[11px] font-semibold font-mono text-on-surface-variant break-all">
                      {vin.coinbase
                        ? vin.coinbase
                        : vin.txid
                          ? `${vin.txid.slice(0, 20)}...${vin.txid.slice(-8)}`
                          : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h2 className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                OUTPUTS
              </h2>
              <span className="text-xs text-outline">
                {formatFloShort(totalOutput.toString())}
              </span>
            </div>
            <div className="space-y-3">
              {tx.vout.map((vout) => (
                <div
                  key={vout.n}
                  className="bg-white border border-outline-variant p-4 rounded-lg space-y-3 hover:shadow-sm transition-all border-l-4 border-l-secondary"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-xs text-outline font-mono font-semibold">
                        #{vout.n}
                      </span>
                      <div className="text-sm font-mono font-semibold text-secondary hover:underline cursor-pointer">
                        {vout.addresses?.[0] ? (
                          <Link href={`/address/${vout.addresses?.[0]}`}>
                            {vout.addresses?.[0]}
                          </Link>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold">
                      {formatFloShort(vout.value)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/50">
                    <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-outline block mb-2">
                      LOCKING SCRIPT (PKH)
                    </span>
                    <div className="text-[11px] font-semibold font-mono text-on-surface-variant break-all">
                      {vout.scriptPubKeyHex ?? ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <RawTransactionData tx={tx} />
      </main>
    </div>
  );
}

function SummaryTile({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-outline-variant p-4 rounded-lg flex flex-col justify-between hover:border-secondary/30 transition-colors ${className}`}
    >
      <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RawTransactionData({ tx }: { tx: any }) {
  const raw = JSON.stringify(
    {
      txid: tx.txid,
      version: tx.version,
      locktime: tx.locktime,
      vin: tx.vin.map((v: any) => ({
        txid: v.txid ?? "coinbase",
        vout: v.vout,
        scriptSig: { asm: v.coinbase ?? "..." },
        sequence: v.sequence,
      })),
      vout: tx.vout.map((v: any) => ({
        value: parseFloat(v.value),
        n: v.n,
        scriptPubKey: {
          asm: v.scriptPubKeyHex ?? "",
          type: v.scriptPubKeyType ?? "",
          address: v.addresses?.[0] ?? "",
        },
      })),
      blockhash: tx.blockHash,
      confirmations: tx.confirmations,
      time: tx.blockTime,
      blocktime: tx.blockTime,
    },
    null,
    2,
  );

  return (
    <div
      className="bg-white border border-outline-variant rounded-lg overflow-hidden"
      id="raw-tx"
    >
      <button
        type="button"
        onClick={() => {
          const pre = document.getElementById("raw-tx-pre");
          if (pre) {
            pre.classList.toggle("hidden");
          }
        }}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors cursor-pointer"
      >
        <h2 className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant flex items-center gap-2">
          <Database className="h-4 w-4" />
          RAW TRANSACTION DATA
        </h2>
        <ChevronDown className="h-5 w-5 text-on-surface-variant transition-transform duration-300" />
      </button>
      <pre
        id="raw-tx-pre"
        className="hidden border-t border-outline-variant p-6 bg-primary-container text-white font-mono text-[11px] font-semibold overflow-x-auto leading-relaxed"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
      >
        {raw}
      </pre>
    </div>
  );
}
