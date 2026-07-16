import { useState } from "react";
import { Star, Crown, Flame, Info } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PersonalRating } from "@/lib/bookkase/moment-types";

interface PersonalRatingInputProps {
  value: PersonalRating | null;
  onChange: (v: PersonalRating | null) => void;
}

/**
 * Five clickable stars supporting quarter-precision (0.25 / 0.5 / 0.75 / 1),
 * plus a crown button that stands in for a rating of 6.
 */
export function PersonalRatingInput({ value, onChange }: PersonalRatingInputProps) {
  const numeric = typeof value === "number" ? value : 0;
  const isCrown = value === "crown";

  const handleStarClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = x / rect.width;
    let q = 1;
    if (frac <= 0.25) q = 0.25;
    else if (frac <= 0.5) q = 0.5;
    else if (frac <= 0.75) q = 0.75;
    else q = 1;
    const next = starIndex + q;
    // Toggle off if clicking the same exact value.
    if (!isCrown && Math.abs(next - numeric) < 0.001) {
      onChange(null);
      return;
    }
    onChange(next);
  };

  const displayValue = isCrown ? 5 : numeric;

  const label = isCrown
    ? "Crown (6)"
    : numeric > 0
    ? numeric.toFixed(2).replace(/\.?0+$/, "")
    : "—";

  return (
    <div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, displayValue - i));
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => handleStarClick(e, i)}
              aria-label={`Set rating to ${i + 1} stars`}
              className="relative h-8 w-8 flex-none"
            >
              <Star
                className="absolute inset-0 h-8 w-8 text-muted-foreground/40"
                strokeWidth={1.5}
              />
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className={`h-8 w-8 ${
                    isCrown ? "text-muted-foreground/40" : "text-amber-500 fill-amber-500"
                  }`}
                  strokeWidth={1.5}
                />
              </div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(isCrown ? null : "crown")}
          aria-label="Crown rating (6)"
          aria-pressed={isCrown}
          className={`ml-1 grid h-8 w-8 place-items-center rounded-full border transition ${
            isCrown
              ? "border-amber-500 bg-amber-500/10 text-amber-500"
              : "border-border/70 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Crown className={`h-4 w-4 ${isCrown ? "fill-amber-500" : ""}`} />
        </button>
        <span className="ml-2 text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

const SPICE_SCALE: Array<{ n: number; label: string; desc: string }> = [
  { n: 0, label: "No Spice", desc: "No romance or sexual content." },
  { n: 1, label: "Wholesome", desc: "Tender romance, off-page intimacy, fade-to-black." },
  { n: 2, label: "Closed Door", desc: "Restrained on-page scene(s), emotional focus." },
  { n: 3, label: "Open Door", desc: "Moderately detailed on-page scene(s)." },
  { n: 4, label: "Smut", desc: "Multiple explicit scenes, direct descriptions." },
  { n: 5, label: "Pervasive", desc: "Frequent explicit scenes, structurally central." },
];

interface SpiceRatingInputProps {
  value: number | null;
  onChange: (v: number | null) => void;
}

export function SpiceRatingInput({ value, onChange }: SpiceRatingInputProps) {
  const [open, setOpen] = useState(false);
  const current = value ?? 0;
  const currentEntry = SPICE_SCALE.find((s) => s.n === current);

  return (
    <div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = current >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value === n ? 0 : n)}
              aria-label={`Set spice to ${n}`}
              className="h-8 w-8 flex-none"
            >
              <Flame
                className={`h-7 w-7 ${
                  active
                    ? "text-orange-500 fill-orange-500"
                    : "text-muted-foreground/40"
                }`}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Spice rating scale"
              className="ml-1 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <Info className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-3 text-sm">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Spice Scale
            </p>
            <ul className="space-y-1.5">
              {SPICE_SCALE.map((s) => (
                <li key={s.n} className="flex gap-2">
                  <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-foreground/5 text-[11px] font-semibold">
                    {s.n}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="text-muted-foreground"> — {s.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
        <span className="ml-2 text-xs text-muted-foreground">
          {currentEntry ? `${current} · ${currentEntry.label}` : "—"}
        </span>
      </div>
    </div>
  );
}

/** Read-only compact display for a saved personal rating. */
export function PersonalRatingDisplay({ value }: { value: PersonalRating }) {
  if (value === "crown") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-500">
        <Crown className="h-4 w-4 fill-amber-500" />
        <span className="text-xs font-medium">6</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative h-4 w-4">
            <Star className="absolute inset-0 h-4 w-4 text-muted-foreground/40" strokeWidth={1.5} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
      <span className="ml-1 text-[11px] text-muted-foreground">
        {value.toFixed(2).replace(/\.?0+$/, "")}
      </span>
    </span>
  );
}

export function SpiceRatingDisplay({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Flame
          key={n}
          className={`h-4 w-4 ${
            value >= n ? "text-orange-500 fill-orange-500" : "text-muted-foreground/30"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
