"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useState, useEffect } from "react";
import {
    Search,
    Blocks,
    Database,
    Gauge,
    Users,
    Clock,
    TrendingUp,
    Settings,
    Moon,
} from "lucide-react";
import {
    getNetworkStats,
    getMempoolInfo,
    getRecentBlocks,
    getRecentTransactions,
} from "@/lib/flo-api";
import { formatNumber, timeAgo, truncateHash } from "@/lib/utils";

export default function HomePage() {
    const router = useRouter();
    const [query, setQuery] = useState("");

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

    const { data: recentBlocks } = useQuery({
        queryKey: ["recentBlocks"],
        queryFn: () => getRecentBlocks(4),
        refetchInterval: 10_000,
    });

    const { data: recentTxs } = useQuery({
        queryKey: ["recentTxs"],
        queryFn: () => getRecentTransactions(4),
        refetchInterval: 10_000,
    });

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!query.trim()) return;
            const trimmed = query.trim();
            if (/^\d+$/.test(trimmed)) {
                router.push(`/block/${trimmed}`);
            } else if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
                router.push(`/tx/${trimmed}`);
            } else if (/^[Ff][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed)) {
                router.push(`/address/${trimmed}`);
            }
        },
        [query, router],
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "/") {
                e.preventDefault();
                document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    const chainInfo = stats?.chainInfo;
    const height = stats?.bestHeight ?? 5291042;
    const difficulty = chainInfo ? chainInfo.difficulty.toFixed(4) : "—";
    const peerCount = stats?.peerCount ?? 182;
    const mempoolSize = mempool?.size ?? 1204;

    const blocks =
        recentBlocks?.map((b) => ({
            height: b.height,
            hash: truncateHash(b.hash, 6),
            age: timeAgo(b.time),
            txns: b.txCount,
            reward: "-",
        })) ?? [];

    const txs =
        recentTxs?.map((t) => ({
            hash: truncateHash(t.txid, 4),
            fullHash: t.txid,
            age: timeAgo(t.blockTime),
            from: t.coinbase
                ? "Coinbase"
                : truncateHash(t.vin?.[0]?.txid ?? "", 4) || "—",
            to: truncateHash(t.vout?.[0]?.addresses?.[0] ?? "", 6) || "—",
            value: t.vout?.length
                ? t.vout
                    .reduce((s, v) => s + parseFloat(v.value || "0"), 0)
                    .toFixed(4) + " FLO"
                : "—",
        })) ?? [];

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: "#fff5e0" }}
        >
            <main className="flex-grow w-full max-w-[1600px] mx-auto px-8 py-4 space-y-8">
                <section className="py-12 flex flex-col items-center text-center">
                    <h1 className="text-[32px] md:text-[32px] font-semibold text-primary mb-8 tracking-tight leading-[40px]">
                        The FLO Blockchain Explorer
                    </h1>
                    <form onSubmit={handleSearch} className="w-full max-w-3xl relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by Address, Transaction, Block Hash or Block Height"
                            className="w-full h-14 pl-12 pr-12 rounded-lg border border-outline-variant bg-white focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none shadow-sm transition-all text-sm"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 border border-outline-variant bg-surface-container rounded px-2 py-0.5 text-[10px] font-mono text-on-surface-variant">
                            /
                        </div>
                    </form>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        icon={Blocks}
                        label="LATEST BLOCK"
                        value={formatNumber(height)}
                    />
                    <MetricCard icon={TrendingUp} label="DIFFICULTY" value={difficulty} />
                    <MetricCard icon={Database} label="TOTAL SUPPLY" value="162.4M FLO" />
                    <MetricCard
                        icon={Gauge}
                        label="TPS"
                        value={
                            <>
                                42.8{" "}
                                <span className="text-xs font-normal text-on-surface-variant">
                                    req/s
                                </span>
                            </>
                        }
                    />
                    <MetricCard
                        icon={Clock}
                        label="MEMPOOL"
                        value={
                            <>
                                {formatNumber(mempoolSize)}{" "}
                                <span className="text-xs font-normal text-on-surface-variant">
                                    txns
                                </span>
                            </>
                        }
                    />
                    <MetricCard
                        icon={Users}
                        label="PEERS"
                        value={formatNumber(peerCount)}
                    />
                    <MetricCard
                        icon={Clock}
                        label="AVG BLOCK TIME"
                        value={
                            <>
                                12.2{" "}
                                <span className="text-xs font-normal text-on-surface-variant">
                                    sec
                                </span>
                            </>
                        }
                    />
                    <MetricCard icon={TrendingUp} label="DIFFICULTY" value="42.1T" />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="text-lg font-semibold text-primary">
                                Network TPS (24h)
                            </h3>
                            <div className="bg-secondary-container/20 text-secondary text-xs px-2 py-1 rounded font-bold">
                                LIVE
                            </div>
                        </div>
                        <div className="p-6 h-64 relative">
                            <svg
                                className="w-full h-full"
                                preserveAspectRatio="none"
                                viewBox="0 0 1000 200"
                            >
                                <defs>
                                    <linearGradient
                                        id="chartGradient"
                                        x1="0"
                                        x2="0"
                                        y1="0"
                                        y2="1"
                                    >
                                        <stop offset="0%" stopColor="#141E46" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#141E46" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M0,150 Q100,100 200,130 T400,80 T600,110 T800,60 T1000,90 V200 H0 Z"
                                    fill="url(#chartGradient)"
                                />
                                <path
                                    d="M0,150 Q100,100 200,130 T400,80 T600,110 T800,60 T1000,90"
                                    fill="none"
                                    stroke="#141E46"
                                    strokeWidth="2"
                                />
                            </svg>
                            <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 pointer-events-none">
                                <div className="border-b border-outline-variant/30 border-dashed" />
                                <div className="border-b border-outline-variant/30 border-dashed" />
                                <div className="border-b border-outline-variant/30 border-dashed" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <h3 className="text-lg font-semibold text-primary">
                                Block Production
                            </h3>
                            <div className="text-on-surface-variant text-xs">
                                Last 14 Days
                            </div>
                        </div>
                        <div className="p-6 h-64 flex items-end justify-between gap-1">
                            <Bar className="opacity-20 h-3/4" />
                            <Bar className="opacity-30 h-2/3" />
                            <Bar className="opacity-40 h-4/5" />
                            <Bar className="opacity-50 h-1/2" />
                            <Bar className="opacity-60 h-2/3" />
                            <Bar className="opacity-70 h-3/4" />
                            <Bar className="h-full" />
                            <Bar className="opacity-80 h-3/4" />
                            <Bar className="opacity-70 h-2/3" />
                            <Bar className="opacity-60 h-4/5" />
                            <Bar className="opacity-50 h-5/6" />
                            <Bar className="opacity-40 h-3/4" />
                            <Bar className="opacity-30 h-2/3" />
                            <Bar className="opacity-20 h-1/2" />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                    <div className="bg-white border border-outline-variant rounded-lg shadow-sm flex flex-col">
                        <div className="p-4 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-primary">
                                Latest Blocks
                            </h3>
                            <Link
                                href="/block"
                                className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-primary-container hover:underline transition-all"
                            >
                                VIEW ALL
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-surface-container-low sticky top-0">
                                    <tr>
                                        <Th>BLOCK</Th>
                                        <Th>AGE</Th>
                                        <Th>TXNS</Th>
                                        <Th align="right">REWARD</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {blocks.map((b) => (
                                        <tr
                                            key={b.height}
                                            className="transition-colors hover:bg-[rgba(141,236,180,0.1)]"
                                        >
                                            <td className="py-4 px-4">
                                                <Link
                                                    href={`/block/${b.height}`}
                                                    className="text-primary font-mono text-[13px] font-semibold leading-5"
                                                >
                                                    {b.height}
                                                </Link>
                                                <div className="text-xs text-on-surface-variant font-mono text-[11px] leading-4 font-semibold">
                                                    {b.hash}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm">{b.age}</td>
                                            <td className="py-4 px-4 text-sm">{b.txns}</td>
                                            <td className="py-4 px-4 text-right text-sm font-mono font-semibold">
                                                {b.reward}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white border border-outline-variant rounded-lg shadow-sm flex flex-col">
                        <div className="p-4 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-primary">
                                Latest Transactions
                            </h3>
                            <Link
                                href="/tx"
                                className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-primary-container hover:underline transition-all"
                            >
                                VIEW ALL
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-surface-container-low sticky top-0">
                                    <tr>
                                        <Th>HASH</Th>
                                        <Th>FROM / TO</Th>
                                        <Th align="right">VALUE</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {txs.map((t) => (
                                        <tr
                                            key={t.hash}
                                            className="transition-colors hover:bg-[rgba(141,236,180,0.1)]"
                                        >
                                            <td className="py-4 px-4">
                                                <Link
                                                    href={`/tx/${t.fullHash}`}
                                                    className="text-primary font-mono text-[13px] font-semibold leading-5 cursor-pointer hover:underline"
                                                >
                                                    {t.hash}
                                                </Link>
                                                <div className="text-xs text-on-surface-variant">
                                                    {t.age}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-on-surface-variant">
                                                        From
                                                    </span>
                                                    <Link
                                                        href={`/address/${t.from}`}
                                                        className="font-mono text-[11px] font-semibold leading-4 text-primary"
                                                    >
                                                        {t.from}
                                                    </Link>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-on-surface-variant">
                                                        To
                                                    </span>
                                                    <Link
                                                        href={`/address/${t.to}`}
                                                        className="font-mono text-[11px] font-semibold leading-4 text-primary"
                                                    >
                                                        {t.to}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="font-mono text-[13px] font-semibold leading-5">
                                                    {t.value}
                                                </div>
                                                <div className="text-xs text-secondary">Confirmed</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="bg-white p-4 border border-outline-variant rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                    {label}
                </span>
            </div>
            <div className="text-xl font-semibold">{value}</div>
        </div>
    );
}

function Bar({ className }: { className?: string }) {
    return (
        <div
            className={`flex-1 bg-primary-container rounded-t-sm ${className ?? ""}`}
        />
    );
}

function Th({
    children,
    align,
}: {
    children: React.ReactNode;
    align?: "right";
}) {
    return (
        <th
            className={`text-left py-3 px-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant border-b border-outline-variant ${align === "right" ? "text-right" : ""
                }`}
        >
            {children}
        </th>
    );
}

function FooterLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary hover:underline transition-all"
        >
            {children}
        </Link>
    );
}
