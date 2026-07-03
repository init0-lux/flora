"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Blocks,
  Clock,
  Hash,
  Database,
  FileText,
  Layers,
  Zap,
  ChevronLeft,
  ChevronRight,
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
import { getBlockByHash, getBlockByHeight } from "@/lib/flo-api";
import { formatDate, formatNumber } from "@/lib/utils";

export default function BlockDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const isHeight = /^\d+$/.test(id);
  const queryFn = isHeight
    ? () => getBlockByHeight(parseInt(id))
    : () => getBlockByHash(id);

  const {
    data: block,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["block", id],
    queryFn,
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

  if (error || !block) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive text-lg">Block not found</p>
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
      {/* Back & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          {block.previousblockhash && (
            <Link
              href={`/block/${block.previousblockhash}`}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          )}
          {block.nextblockhash && (
            <Link
              href={`/block/${block.nextblockhash}`}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Blocks className="h-8 w-8 text-primary" />
          Block #{formatNumber(block.height)}
        </h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm break-all">
          {block.hash}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <InfoCard
          icon={Clock}
          label="Timestamp"
          value={formatDate(block.time)}
        />
        <InfoCard
          icon={Layers}
          label="Confirmations"
          value={formatNumber(block.confirmations)}
        />
        <InfoCard
          icon={Database}
          label="Size"
          value={`${block.size.toLocaleString()} bytes`}
        />
        <InfoCard
          icon={Zap}
          label="Weight"
          value={`${block.weight.toLocaleString()} WU`}
        />
        <InfoCard
          icon={Hash}
          label="Version"
          value={`${block.version} (${block.versionHex})`}
        />
        <InfoCard
          icon={FileText}
          label="Nonce"
          value={formatNumber(block.nonce)}
        />
        <InfoCard
          icon={FileText}
          label="Difficulty"
          value={formatNumber(Math.round(block.difficulty))}
        />
        <InfoCard icon={Hash} label="Bits" value={block.bits} />
      </div>

      {/* Merkle Root */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Merkle Root</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xs font-mono break-all bg-muted px-2 py-1 rounded">
            {block.merkleroot}
          </code>
        </CardContent>
      </Card>

      {/* Chainwork */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Chainwork</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xs font-mono break-all bg-muted px-2 py-1 rounded">
            {block.chainwork}
          </code>
        </CardContent>
      </Card>

      {/* Previous / Next Block Hashes */}
      <div className="grid gap-4 md:grid-cols-2">
        {block.previousblockhash && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Previous Block
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HashDisplay
                hash={block.previousblockhash}
                href={`/block/${block.previousblockhash}`}
                chars={20}
              />
            </CardContent>
          </Card>
        )}
        {block.nextblockhash && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Next Block</CardTitle>
            </CardHeader>
            <CardContent>
              <HashDisplay
                hash={block.nextblockhash}
                href={`/block/${block.nextblockhash}`}
                chars={20}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Transactions ({formatNumber(block.nTx)})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.transactions.map((txid) => (
                <TableRow key={txid}>
                  <TableCell className="font-mono">
                    <HashDisplay hash={txid} href={`/tx/${txid}`} chars={20} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
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
