import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a FLO amount (string) to a human-readable string with 8 decimals.
 */
export function formatFlo(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0 FLO";
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 })} FLO`;
}

/**
 * Format a FLO amount in a concise format.
 */
export function formatFloShort(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0 FLO";
  if (num >= 1000) return `${(num / 1000).toFixed(2)}k FLO`;
  if (num >= 1) return `${num.toFixed(4)} FLO`;
  return `${num.toFixed(8)} FLO`;
}

/**
 * Format a timestamp to a relative time string (e.g. "2m ago").
 */
export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Format a timestamp to a human-readable date string.
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Truncate a hash string to a short representation.
 */
export function truncateHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

/**
 * Format a number with comma separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
