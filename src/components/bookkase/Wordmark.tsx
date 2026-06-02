/**
 * BookKase wordmark.
 *
 * Drop the official SVG at `public/bookkase-wordmark.svg` and this component
 * will use it automatically. Until then it renders a styled fallback in
 * Libre Baskerville so the brand voice still shows through.
 */
import { useEffect, useState } from "react";

export function Wordmark({ className = "" }: { className?: string }) {
  const [hasAsset, setHasAsset] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/bookkase-wordmark.svg", { method: "HEAD" })
      .then((r) => !cancelled && setHasAsset(r.ok))
      .catch(() => !cancelled && setHasAsset(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (hasAsset) {
    return (
      <img
        src="/bookkase-wordmark.svg"
        alt="BookKase"
        className={`h-7 w-auto select-none ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <span
      className={`bk-display select-none text-[1.35rem] leading-none tracking-[-0.01em] text-foreground ${className}`}
      aria-label="BookKase"
    >
      Book<span className="text-[color:var(--indigo)]">Kase</span>
    </span>
  );
}
