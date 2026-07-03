import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { truncateHash } from "@/lib/utils";

interface HashDisplayProps {
  hash: string;
  href?: string;
  chars?: number;
  copyable?: boolean;
}

export function HashDisplay({
  hash,
  href,
  chars = 8,
  copyable = true,
}: HashDisplayProps) {
  const truncated = truncateHash(hash, chars);

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs">
      {href ? (
        <Link
          href={href}
          className="text-primary hover:underline underline-offset-2"
        >
          {truncated}
        </Link>
      ) : (
        <span>{truncated}</span>
      )}
      {copyable && <CopyButton value={hash} />}
    </span>
  );
}
