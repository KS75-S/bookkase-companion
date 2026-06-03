import { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

import type { UserBook } from "@/lib/bookkase/types";
import { OmbreProgress } from "./OmbreProgress";
import { UpdateProgressSheet } from "./UpdateProgressSheet";
import { AddMomentSheet } from "./AddMomentSheet";

function parseTimestampSeconds(v: string): number | null {
  const parts = v.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

function formatProgressLabel(ub: UserBook): string {
  const t = ub.progress_type;
  const v = ub.progress_value;
  if (!t || !v) return "—";
  if (t === "percentage") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? `${Math.round(n)}%` : v;
  }
  if (t === "page") {
    const total = ub.book?.total_pages;
    return total ? `Page ${v} of ${total}` : `Page ${v}`;
  }
  if (t === "chapter") {
    const total = ub.book?.total_chapters;
    return total ? `Chapter ${v} of ${total}` : `Chapter ${v}`;
  }
  if (t === "timestamp") return v;
  return v;
}

/**
 * Returns a 0-1 fraction when the metadata needed to compute it exists,
 * otherwise null so the UI can show an empty/neutral bar instead of 0%.
 */
function progressFraction(ub: UserBook): number | null {
  const t = ub.progress_type;
  const v = ub.progress_value;
  if (!t || !v) return null;
  if (t === "percentage") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n / 100)) : null;
  }
  if (t === "page") {
    const total = ub.book?.total_pages;
    const cur = parseInt(v, 10);
    if (!total || !Number.isFinite(cur)) return null;
    return Math.max(0, Math.min(1, cur / total));
  }
  if (t === "chapter") {
    const total = ub.book?.total_chapters;
    const cur = parseInt(v, 10);
    if (!total || !Number.isFinite(cur)) return null;
    return Math.max(0, Math.min(1, cur / total));
  }
  if (t === "timestamp") {
    const total = ub.book?.total_duration_seconds;
    const cur = parseTimestampSeconds(v);
    if (!total || cur == null) return null;
    return Math.max(0, Math.min(1, cur / total));
  }
  return null;
}

function missingMetadataHint(ub: UserBook): string | null {
  const t = ub.progress_type;
  if (!t) return null;
  if (t === "page" && !ub.book?.total_pages) return "Total pages needed to calculate reading progress.";
  if (t === "chapter" && !ub.book?.total_chapters) return "Total chapters needed to calculate reading progress.";
  if (t === "timestamp" && !ub.book?.total_duration_seconds) return "Total duration needed to calculate listening progress.";
  return null;
}

export function BookCard({ ub }: { ub: UserBook }) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [momentOpen, setMomentOpen] = useState(false);

  const book = ub.book;
  const fraction = progressFraction(ub);

  return (
    <article className="bk-card overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="relative h-[110px] w-[74px] flex-none overflow-hidden rounded-md bg-[color:var(--surface-2)] shadow-[0_8px_20px_-10px_oklch(0_0_0/0.35)]">
          {book?.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <BookOpen size={20} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="bk-display truncate text-[1.05rem] leading-snug text-foreground">
            {book?.title ?? "Untitled"}
          </h3>
          {book?.author ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{book.author}</p>
          ) : null}
          <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/80">
            {ub.status === "listening" ? "Listening" : ub.status === "rereading" ? "Rereading" : "Reading"}
          </p>
          <div className="mt-3">
            <OmbreProgress value={fraction} />
            <p className="mt-1.5 text-xs text-muted-foreground">{formatProgressLabel(ub)}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border bg-[color:var(--surface-2)]/40 px-4 py-3">
        <button className="bk-pill flex-1 text-sm" onClick={() => setUpdateOpen(true)}>
          Update Progress
        </button>
        <button
          className="bk-pill-ghost flex items-center gap-1.5 text-sm"
          onClick={() => setMomentOpen(true)}
        >
          <Sparkles size={14} className="text-[color:var(--lavender)]" />
          Moment
        </button>
      </div>

      <UpdateProgressSheet open={updateOpen} onOpenChange={setUpdateOpen} ub={ub} />
      <AddMomentSheet open={momentOpen} onOpenChange={setMomentOpen} ub={ub} />
    </article>
  );
}
