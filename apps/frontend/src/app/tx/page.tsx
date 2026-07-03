"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TransactionResponse } from "@/lib/flo-api";
import { formatNumber, timeAgo, truncateHash } from "@/lib/utils";

export default function TxListPage() {
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["txs", page],
    queryFn: async () => {
      const res = await fetch(
        `http://127.0.0.1:3099/api/v1/txs?limit=${limit}`,
      );
      const json = await res.json();
      return json as { items: TransactionResponse[]; itemsOnPage: number };
    },
    refetchInterval: page === 1 ? 10000 : undefined,
  });

  const items = data?.items ?? [];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#fff5e0" }}
    >
      <div className="max-w-[1600px] mx-auto px-8 py-8 w-full">
        <h1 className="text-[32px] font-semibold text-primary mb-8">
          Transactions
        </h1>

        <div className="bg-white border border-outline-variant rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-surface-container-low sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant border-b border-outline-variant">
                    TX Hash
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant border-b border-outline-variant">
                    Block
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant border-b border-outline-variant">
                    Age
                  </th>
                  <th className="text-right py-3 px-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant border-b border-outline-variant">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-on-surface-variant"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {items.map((tx) => (
                  <tr
                    key={tx.txid}
                    className="transition-colors hover:bg-[rgba(141,236,180,0.1)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/tx/${tx.txid}`}
                        className="group flex items-center gap-2"
                      >
                        <span className="font-mono text-[13px] text-primary font-semibold group-hover:underline">
                          {truncateHash(tx.txid, 8)}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg
                            className="h-4 w-4 text-outline animate-pulse"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M7 17l9.2-9.2M17 17V7H7" />
                          </svg>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/block/${tx.blockHeight}`}
                        className="text-primary font-mono text-[13px] hover:underline"
                      >
                        {formatNumber(tx.blockHeight)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-on-surface-variant">
                      {timeAgo(tx.blockTime)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {tx.size} B
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-outline-variant bg-surface-container-low">
            <div className="text-xs text-outline">
              Showing {items.length} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-outline-variant rounded hover:bg-surface-container transition-all disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-outline-variant rounded hover:bg-surface-container transition-all disabled:opacity-30 cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
