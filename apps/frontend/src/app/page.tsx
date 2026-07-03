"use client";

import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HashDisplay } from "@/components/hash-display";
import {
  getChainInfo,
  getRecentBlocks,
  getRecentTransactions,
  searchQuery,
  type Block,
  type Transaction,
} from "@/lib/flo-api";
import { formatFloShort, formatNumber, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Clock,
  Hash,
  Layers,
  Activity,
  Search,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const { data: chainInfo, isLoading: chainLoading } = useQuery({
    queryKey: ["chainInfo"],
    queryFn: getChainInfo,
  });

  const { data: recentBlocks, isLoading: blocksLoading } = useQuery({
    queryKey: ["recentBlocks"],
    queryFn: () => getRecentBlocks(10),
  });

  const { data: recentTxs, isLoading: txsLoading } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: () => getRecentTransactions(10),
  });

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      setSearching(true);
      try {
        const result = await searchQuery(query);
        if (result.type === "block") {
          router.push(`/block/${result.value}`);
        } else if (result.type === "transaction") {
          router.push(`/tx/${result.value}`);
        } else if (result.type === "address") {
          router.push(`/address/${result.value}`);
        }
      } finally {
        setSearching(false);
      }
    },
    [query, router],
  );

  const statCards = chainInfo
    ? [
        {
          label: "Best Block",
          value: `#${formatNumber(chainInfo.bestBlockHeight)}`,
          icon: Blocks,
        },
        {
          label: "Difficulty",
          value: formatNumber(Math.round(chainInfo.difficulty)),
          icon: Activity,
        },
        {
          label: "Chain",
          value: chainInfo.chain === "main" ? "Mainnet" : chainInfo.chain,
          icon: Layers,
        },
        {
          label: "Protocol",
          value: `v${chainInfo.protocolVersion}`,
          icon: Hash,
        },
      ]
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          FLO Blockchain Explorer
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Explore transactions, addresses, blocks, and monitor the health of the
          FLO network.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by address, txid, block hash, or height..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-4 h-14 text-lg rounded-xl"
            />
          </div>
        </form>
      </section>

      {/* Stats */}
      <section className="mb-8">
        {chainLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-semibold text-sm truncate">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent Blocks & Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Blocks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Blocks className="h-4 w-4" />
              Recent Blocks
            </CardTitle>
            <Link
              href="/block"
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {blocksLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {recentBlocks?.map((block) => (
                  <BlockRow key={block.hash} block={block} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Transactions
            </CardTitle>
            <Link
              href="/tx"
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {txsLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {recentTxs?.map((tx) => (
                  <TxRow key={tx.txid} tx={tx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BlockRow({ block }: { block: Block }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Badge variant="secondary" className="font-mono shrink-0">
          #{formatNumber(block.height)}
        </Badge>
        <HashDisplay
          hash={block.hash}
          href={`/block/${block.hash}`}
          chars={12}
        />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo(block.time)}
        </span>
        <span>{block.nTx} txs</span>
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  const value = tx.vout.reduce((sum, out) => sum + parseFloat(out.value), 0);
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <HashDisplay hash={tx.txid} href={`/tx/${tx.txid}`} chars={12} />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
        <span className="hidden sm:inline">
          {formatFloShort(value.toString())}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo(tx.time)}
        </span>
      </div>
    </div>
  );
}
