"use client";

import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { getNetworkStats, getMempoolInfo } from "@/lib/flo-api";
import { formatNumber } from "@/lib/utils";

export default function NetworkHealthPage() {
  const { data: stats } = useQuery({
    queryKey: ["networkStats"],
    queryFn: getNetworkStats,
    refetchInterval: 30_000,
  });

  const { data: mempool } = useQuery({
    queryKey: ["mempoolInfo"],
    queryFn: getMempoolInfo,
    refetchInterval: 15_000,
  });

  const title = "Network Overview | FLO Explorer";
  const desc = `FLO blockchain network status — block height ${stats?.bestHeight ?? "..."}, mempool ${stats?.mempool?.size ?? 0} transactions, ${stats?.peerCount ?? 0} peers.`;

  return (
    <div className="space-y-6" style={{ backgroundColor: "#fff5e0" }}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
      </Head>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface border border-outline-variant rounded-xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h1 className="text-[32px] font-semibold text-primary mb-2 leading-[40px] tracking-tight">
                  Network Overview
                </h1>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2 bg-on-secondary-container/10 text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.05em] uppercase">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                    </span>
                    HEALTHY
                  </span>
                  <span className="text-on-surface-variant text-xs">
                    Mainnet-V4 &bull; Last Block: 2 minutes ago
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">
                  NETWORK LOAD
                </p>
                <p className="text-xl font-semibold text-primary">14.2%</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-4">
              NODE SYNC STATUS
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-primary">
                    Global Consensus
                  </span>
                  <span className="text-on-surface-variant">99.98%</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full transition-all duration-1000"
                    style={{ width: "99.98%" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[10px] text-on-surface-variant mb-1">
                    LATENCY
                  </p>
                  <p className="text-sm font-mono font-semibold text-primary">
                    42ms
                  </p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[10px] text-on-surface-variant mb-1">
                    UPTIME
                  </p>
                  <p className="text-sm font-mono font-semibold text-primary">
                    99.99%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <StatCard
            label="HASH RATE"
            value="48.2 EH/s"
            trend={{ value: "+2.4%", direction: "up" }}
          />
          <StatCard label="DIFFICULTY" value="12.8 T" subtitle="Next: 14.1 T" />
          <StatCard
            label="MEMPOOL SIZE"
            value={`${mempool ? formatNumber(mempool.size) : "1,248"} TXs`}
            trend={{ value: "High Vol", direction: "warning" }}
          />
          <StatCard
            label="NODES"
            value="14,209"
            trend={{ value: "All Active", direction: "up" }}
          />
          <div className="hidden lg:block bg-primary-container text-on-primary-container rounded-xl p-5 relative overflow-hidden">
            <p className="text-[11px] font-bold tracking-[0.05em] uppercase opacity-60 mb-1">
              SUPPLY CAP
            </p>
            <h4 className="text-xl font-semibold text-on-primary">21M FLO</h4>
            <p className="text-xs opacity-80 mt-2">Circulating: 18.9M</p>
            <div className="mt-4 w-full bg-white/10 h-1 rounded-full">
              <div
                className="bg-secondary-fixed h-full"
                style={{ width: "90%" }}
              />
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <svg
                className="h-28 w-28"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                <line x1="12" y1="6" x2="12" y2="12" />
                <line x1="12" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-semibold text-primary">
                Transactions Per Second
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-2 py-1 bg-white border border-outline-variant text-[10px] font-bold rounded"
                >
                  1H
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-[10px] font-bold rounded opacity-50"
                >
                  24H
                </button>
              </div>
            </div>
            <div className="p-6 h-64 flex items-end gap-2 relative">
              <svg
                className="absolute inset-x-0 bottom-0 w-full h-48 px-6 overflow-visible"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,48 Q40,10 80,35 T160,20 T240,40 T320,10 T400,30 T480,25 T560,45 T640,15 L640,48 L0,48 Z"
                  fill="url(#tpsGrad)"
                  fillOpacity="0.1"
                />
                <path
                  d="M0,48 Q40,10 80,35 T160,20 T240,40 T320,10 T400,30 T480,25 T560,45 T640,15"
                  fill="none"
                  stroke="#006d3b"
                  strokeWidth="2"
                />
                <defs>
                  <linearGradient
                    id="tpsGrad"
                    x1="0%"
                    x2="0%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#006d3b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#006d3b" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute left-6 top-8 text-[10px] text-on-surface-variant opacity-40 flex flex-col gap-12">
                <span>40 TPS</span>
                <span>20 TPS</span>
                <span>0 TPS</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-semibold text-primary">
                Total Supply Curve
              </h3>
              <button
                type="button"
                className="px-2 py-1 text-[10px] font-bold rounded opacity-50"
              >
                ALL
              </button>
            </div>
            <div className="p-6 h-64 relative">
              <div className="absolute inset-0 m-6 border-l border-b border-outline-variant/30 flex items-end">
                <svg
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,100 C150,90 300,50 600,10"
                    fill="none"
                    stroke="#141e46"
                    strokeWidth="3"
                  />
                  <circle cx="600" cy="10" fill="#141e46" r="4" />
                </svg>
              </div>
              <div className="absolute right-10 top-10 bg-primary-container text-on-primary-container text-[10px] px-2 py-1 rounded">
                Max: 21,000,000
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-semibold text-primary">
                Block Interval Variance
              </h3>
            </div>
            <div
              className="p-6 grid grid-cols-24 items-end gap-1 h-64"
              style={{ gridTemplateColumns: "repeat(24, 1fr)" }}
            >
              {[
                28, 15, 42, 22, 35, 18, 48, 30, 12, 38, 25, 20, 45, 32, 16, 40,
                28, 10, 36, 24, 50, 18, 34, 22,
              ].map((h, i) => (
                <div
                  key={i}
                  className="bg-outline-variant hover:bg-primary transition-colors rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-semibold text-primary">
                Difficulty Adjustment
              </h3>
            </div>
            <div className="p-6 h-64 flex items-center justify-center">
              <div className="relative w-48 h-48 rounded-full border-[16px] border-surface-container-high flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    fill="transparent"
                    r="42%"
                    stroke="#006d3b"
                    strokeDasharray="180 100"
                    strokeWidth="16"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                    NEXT EPOCH
                  </p>
                  <p className="text-xl font-bold text-primary">12D 4H</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h3 className="text-[11px] font-bold tracking-[0.05em] uppercase text-primary">
              LIVE NETWORK ACTIVITY
            </h3>
            <span className="text-[10px] text-on-surface-variant">
              Updating every 500ms
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low/50 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant border-b border-outline-variant">
                <tr>
                  <Th>BLOCK HASH</Th>
                  <Th>VALIDATOR</Th>
                  <Th>TX COUNT</Th>
                  <Th>SIZE</Th>
                  <Th align="right">TIME</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {activity.map((row) => (
                  <tr
                    key={row.hash}
                    className="hover:bg-secondary/10 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-[13px] font-semibold text-secondary">
                      {row.hash}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                      {row.validator}
                    </td>
                    <td className="px-6 py-4 text-xs">{row.txCount}</td>
                    <td className="px-6 py-4 text-xs">{row.size}</td>
                    <td className="px-6 py-4 text-right text-xs opacity-60">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-outline-variant bg-surface-container-low text-center">
            <button
              type="button"
              className="text-[11px] font-bold tracking-[0.05em] uppercase text-secondary font-bold hover:underline"
            >
              VIEW ALL BLOCKS
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  subtitle,
}: {
  label: string;
  value: string;
  trend?: { value: string; direction: "up" | "warning" };
  subtitle?: string;
}) {
  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-5 hover:border-secondary transition-all group">
      <p className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
        {label}
      </p>
      <h4 className="text-xl font-semibold text-primary mt-3">{value}</h4>
      {trend && (
        <p
          className={`text-xs flex items-center gap-1 mt-1 ${trend.direction === "up" ? "text-secondary" : "text-on-surface-variant"}`}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {trend.direction === "up" ? (
              <>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </>
            ) : (
              <>
                <polyline points="12 9 12 15" />
                <line x1="9" y1="12" x2="15" y2="12" />
              </>
            )}
          </svg>
          {trend.value}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-on-surface-variant opacity-60 mt-1">
          {subtitle}
        </p>
      )}
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

const activity = [
  {
    hash: "0x14f2...8e21",
    validator: "Node-Alpha-09",
    txCount: 421,
    size: "1.2 MB",
    time: "12s ago",
  },
  {
    hash: "0x9a3c...d442",
    validator: "FLO-Pool-Core",
    txCount: 158,
    size: "0.8 MB",
    time: "45s ago",
  },
  {
    hash: "0x76bb...a019",
    validator: "Genesis-Node",
    txCount: 892,
    size: "2.4 MB",
    time: "2m ago",
  },
];
