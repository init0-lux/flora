"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  FlaskConical,
  Globe,
  Layers,
  Users,
  Database,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getNetworkStats, getMempoolInfo } from "@/lib/flo-api";
import { formatNumber } from "@/lib/utils";

export default function NetworkHealthPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["networkStats"],
    queryFn: getNetworkStats,
    refetchInterval: 30_000,
  });

  const { data: mempool } = useQuery({
    queryKey: ["mempoolInfo"],
    queryFn: getMempoolInfo,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FlaskConical className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Network Health</h1>
          <p className="text-muted-foreground">
            Real-time status of the FLO blockchain network
          </p>
        </div>
      </div>

      {/* Sync Status */}
      {stats && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    stats.syncStatus.synced
                      ? "bg-green-500"
                      : "bg-yellow-500 animate-pulse"
                  }`}
                />
                <div>
                  <p className="font-semibold">
                    {stats.syncStatus.synced ? "Synced" : "Syncing..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Block {formatNumber(stats.syncStatus.currentBlock)}
                    {!stats.syncStatus.synced &&
                      ` / ${formatNumber(stats.syncStatus.highestBlock)}`}
                  </p>
                </div>
              </div>
              {!stats.syncStatus.synced && (
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{(stats.syncStatus.progress * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${stats.syncStatus.progress * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ETA: {stats.syncStatus.eta}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chain Info */}
      {stats && (
        <>
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Chain Information
            </h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <NetworkCard
                icon={Layers}
                label="Best Block"
                value={`#${formatNumber(stats.chainInfo.bestBlockHeight)}`}
              />
              <NetworkCard
                icon={Activity}
                label="Difficulty"
                value={formatNumber(Math.round(stats.chainInfo.difficulty))}
              />
              <NetworkCard
                icon={Database}
                label="Blockchain Size"
                value={`${(stats.chainInfo.sizeOnDisk / 1073741824).toFixed(2)} GB`}
              />
              <NetworkCard
                icon={Clock}
                label="Protocol Version"
                value={stats.chainInfo.protocolVersion.toString()}
              />
              <NetworkCard
                icon={Badge}
                label="Version"
                value={stats.chainInfo.subversion}
              />
              <NetworkCard
                icon={Layers}
                label="Chain"
                value={stats.chainInfo.chain}
              />
              <NetworkCard
                icon={TrendingUp}
                label="Time Offset"
                value={`${stats.chainInfo.timeOffset}s`}
              />
            </div>
          </section>

          {/* Best Block Hash */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Best Block Hash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs font-mono break-all bg-muted px-2 py-1 rounded">
                {stats.chainInfo.bestBlockHash}
              </code>
            </CardContent>
          </Card>

          {/* Peer Count */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Network Peers
            </h2>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatNumber(stats.peerCount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connected Peers
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* Mempool */}
      {mempool && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Mempool
          </h2>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div className="grid gap-4 grid-cols-2">
              <NetworkCard
                icon={Activity}
                label="Pending Transactions"
                value={formatNumber(mempool.size)}
              />
              <NetworkCard
                icon={Database}
                label="Total Size"
                value={`${(mempool.bytes / 1024 / 1024).toFixed(2)} MB`}
              />
              <NetworkCard
                icon={Database}
                label="Memory Usage"
                value={`${(mempool.usage / 1024 / 1024).toFixed(2)} MB`}
              />
              <NetworkCard
                icon={Layers}
                label="Min Relay Fee"
                value={`${mempool.minRelayTxFee} FLO/kB`}
              />
            </div>

            {/* Fee Histogram */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Fee Histogram
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Rate (FLO/kB)</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mempool.histogram.map((bucket, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {bucket.feerate.toFixed(5)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(bucket.count)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {(bucket.bytes / 1024).toFixed(1)} kB
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}

function NetworkCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold text-sm truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
