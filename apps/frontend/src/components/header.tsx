"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Search, Settings, Moon } from "lucide-react";

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

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

  return (
    <header className="bg-surface sticky top-0 border-b border-outline-variant z-50">
      <div className="flex items-center justify-between w-full px-8 max-w-[1600px] mx-auto h-16">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-semibold text-primary tracking-tighter"
          >
            FLO Explorer
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#"
              className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              API Docs
            </Link>
            <Link
              href="#"
              className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              GitHub
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-1.5 text-sm w-80 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                placeholder="Search hash, address, block..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-outline px-1.5 py-0.5 border border-outline-variant rounded">
                /
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 hover:bg-secondary-container/20 rounded-full transition-all cursor-pointer"
            >
              <Settings className="h-5 w-5 text-on-surface-variant" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-secondary-container/20 rounded-full transition-all cursor-pointer"
            >
              <Moon className="h-5 w-5 text-on-surface-variant" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
