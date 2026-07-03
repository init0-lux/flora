"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Hash,
  Layers,
  ArrowUpDown,
  List,
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
import { HashDisplay } from "@/components/hash-display";
import {
  getAddressInfo,
  getAddressTransactions,
  getAddressUtxos,
} from "@/lib/flo-api";
import { formatFloShort, formatNumber, timeAgo } from "@/lib/utils";
import { useState } from "react";

export default function AddressDetailPage() {
  const params = useParams();
  const address = params.id as string;
  const [page, setPage] = useState(1);

  const { data: info, isLoading: infoLoading } = useQuery({
    queryKey: ["address", address],
    queryFn: () => getAddressInfo(address),
  });

  const { data: txs, isLoading: txsLoading } = useQuery({
    queryKey: ["addressTxs", address, page],
    queryFn: () => getAddressTransactions(address, page, 25),
  });

  const { data: utxos, isLoading: utxosLoading } = useQuery({
    queryKey: ["addressUtxos", address],
    queryFn: () => getAddressUtxos(address),
  });

  if (infoLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive text-lg">Address not found</p>
        <Link
          href="/"
          className="inline-flex items-center text-sm text-primary hover:underline mt-2"
        >
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Address
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <code className="text-sm font-mono break-all bg-muted px-2 py-1 rounded">
            {address}
          </code>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <BalanceCard
          icon={Wallet}
          label="Balance"
          value={formatFloShort(info.balance)}
        />
        <BalanceCard
          icon={Layers}
          label="Unconfirmed"
          value={formatFloShort(info.unconfirmedBalance)}
        />
        <BalanceCard
          icon={ArrowUpDown}
          label="Total Received"
          value={formatFloShort(info.totalReceived)}
        />
        <BalanceCard
          icon={ArrowUpDown}
          label="Total Sent"
          value={formatFloShort(info.totalSent)}
        />
      </div>

      {/* TX Count */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <BalanceCard
          icon={List}
          label="Transactions"
          value={formatNumber(info.txCount)}
        />
        <BalanceCard
          icon={List}
          label="Pending Txs"
          value={formatNumber(info.unconfirmedTxCount)}
        />
        <BalanceCard
          icon={Layers}
          label="UTXOs"
          value={formatNumber(info.utxoCount)}
        />
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Transaction History
            {txs && (
              <span className="text-muted-foreground text-sm ml-2">
                (Page {page})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs?.items.map((tx) => (
                    <TableRow key={tx.txid}>
                      <TableCell className="font-mono">
                        <HashDisplay
                          hash={tx.txid}
                          href={`/tx/${tx.txid}`}
                          chars={16}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatFloShort(tx.fee)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Badge variant="secondary">
                          {formatFloShort(tx.fee)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {timeAgo(tx.time)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {txs && txs.hasMore && (
                <div className="flex justify-center p-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!txs.hasMore}
                    className="inline-flex items-center justify-center h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap border border-border bg-background hover:bg-muted hover:text-foreground transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* UTXOs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            UTXOs ({utxos?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {utxosLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>VOUT</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Confirmations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utxos?.map((utxo) => (
                  <TableRow key={`${utxo.txid}:${utxo.vout}`}>
                    <TableCell className="font-mono">
                      <HashDisplay
                        hash={utxo.txid}
                        href={`/tx/${utxo.txid}`}
                        chars={16}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{utxo.vout}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatFloShort(utxo.value)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(utxo.confirmations)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceCard({
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
