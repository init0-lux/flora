"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, Blocks, Menu, X, FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { searchQuery } from "@/lib/flo-api";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      setSearching(true);
      try {
        const result = await searchQuery(query);
        if (result.type === "block") {
          const isHeight = /^\d+$/.test(result.value);
          router.push(
            isHeight ? `/block/${result.value}` : `/block/${result.value}`,
          );
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

  const navLinks = [
    { href: "/", label: "Home", icon: Blocks },
    { href: "/network", label: "Network", icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Blocks className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">FLO Explorer</span>
        </Link>

        {/* Desktop search */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xl mx-4"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address, txid, block hash, or height..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-4 h-10"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t overflow-hidden transition-all duration-200",
          mobileOpen ? "max-h-80" : "max-h-0",
        )}
      >
        <div className="px-4 py-3 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
