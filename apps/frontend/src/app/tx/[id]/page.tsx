"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Copy, FileText, Hash, Layers } from "lucide-react";
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
import { getTransaction } from "@/lib/flo-api";
import { formatFloShort, formatDate, formatNumber } from "@/lib/utils";

export default function TransactionDetailPage() {
  const params = useParams();
  const txid = params.id as string;

  const {
    data: tx,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transaction", txid],
    queryFn: () => getTransaction(txid),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive text-lg">Transaction not found</p>
        <Link
          href="/"
          className="inline-flex items-center text-sm text-primary hover:underline mt-2"
        >
          Return home
        </Link>
      </div>
    );
  }

  const totalInput = tx.vin.reduce(
    (sum, vin) => sum + parseFloat(vin.value),
    0,
  );
  const totalOutput = tx.vout.reduce(
    (sum, vout) => sum + parseFloat(vout.value),
    0,
  );
  const fee = parseFloat(tx.fee);

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
          <FileText className="h-8 w-8 text-primary" />
          Transaction
        </h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm break-all">
          {tx.txid}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <SummaryCard
          icon={Layers}
          label="Confirmations"
          value={formatNumber(tx.confirmations)}
        />
        <SummaryCard
          icon={Clock}
          label="Timestamp"
          value={formatDate(tx.time)}
        />
        <SummaryCard
          icon={Hash}
          label="Block Height"
          value={
            <Link
              href={`/block/${tx.blockheight}`}
              className="text-primary hover:underline"
            >
              #{formatNumber(tx.blockheight)}
            </Link>
          }
        />
        <SummaryCard icon={Copy} label="Size" value={`${tx.size} bytes`} />
        <SummaryCard
          icon={Hash}
          label="Total Input"
          value={formatFloShort(totalInput.toString())}
        />
        <SummaryCard
          icon={Hash}
          label="Total Output"
          value={formatFloShort(totalOutput.toString())}
        />
        <SummaryCard icon={Hash} label="Fee" value={formatFloShort(tx.fee)} />
        <SummaryCard
          icon={Hash}
          label="Fee Rate"
          value={`${(fee / tx.vsize).toFixed(8)} FLO/vB`}
        />
      </div>

      {/* VIN Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inputs ({tx.vin.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>VOUT</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tx.vin.map((vin, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">
                    {vin.coinbase ? (
                      <Badge variant="secondary">Coinbase</Badge>
                    ) : vin.txid ? (
                      <HashDisplay
                        hash={vin.txid}
                        href={`/tx/${vin.txid}`}
                        chars={12}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vin.coinbase ? "—" : (vin.vout?.toString() ?? "—")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {vin.addresses.length > 0 ? (
                      <HashDisplay
                        hash={vin.addresses[0]}
                        href={`/address/${vin.addresses[0]}`}
                        chars={12}
                      />
                    ) : vin.coinbase ? (
                      <span className="text-muted-foreground text-xs break-all font-mono">
                        {vin.coinbase.slice(0, 40)}...
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatFloShort(vin.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* VOUT Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outputs ({tx.vout.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Script Type</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tx.vout.map((vout) => (
                <TableRow key={vout.n}>
                  <TableCell className="font-mono">{vout.n}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {vout.scriptPubKey.addresses.length > 0 ? (
                      <HashDisplay
                        hash={vout.scriptPubKey.addresses[0]}
                        href={`/address/${vout.scriptPubKey.addresses[0]}`}
                        chars={12}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {vout.scriptPubKey.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vout.spent ? (
                      <Badge variant="secondary">Spent</Badge>
                    ) : (
                      <Badge variant="outline">Unspent</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatFloShort(vout.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Block Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Block Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Block Hash</p>
              <HashDisplay
                hash={tx.blockhash}
                href={`/block/${tx.blockhash}`}
                chars={16}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Block Height</p>
              <Link
                href={`/block/${tx.blockheight}`}
                className="text-primary hover:underline font-mono text-sm"
              >
                #{formatNumber(tx.blockheight)}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Block Time</p>
              <p className="font-mono text-sm">{formatDate(tx.blocktime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Locktime</p>
              <p className="font-mono text-sm">{tx.locktime}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="font-semibold text-sm truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
