import { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

import type { UserBook } from "@/lib/bookkase/types";
import { OmbreProgress } from "./OmbreProgress";
import { UpdateProgressSheet } from "./UpdateProgressSheet";
import { AddMomentSheet } from "./AddMomentSheet";

function formatProgressLabel(ub: UserBook): string {
  const t = ub.progress_type;
  const v = ub.progress_value;
  if (!t || !v) return "—";
  if (t === "percentage") return `${parseInt(v, 10)}%`;
  if (t === "page") {
    const total = ub.book?.total_pages;
    return total ? `Page ${v} of ${total}` : `Page ${v}`;
  }
  if (t === "chapter") return `Chapter ${v}`;
  if (t === "timestamp") return v;
  return v;
}

function progressFraction(ub: UserBook): number {
  const t = ub.progress_type;
  const v = ub.progress_value;
  if (!t || !v) return 0;
  if (t === "percentage") return Math.min(1, parseFloat(v) / 100);
  if (t === "page" && ub.book?.total_pages) {
    return Math.min(1, parseInt(v, 10) / ub.book.total_pages);
  }
  if (t === "timestamp" && ub.book?.total_duration_seconds) {
    const parts = v.split(":").map((p) => parseInt(p, 10) || 0);
    let secs = 0;
    if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) secs = parts[0] * 60 + parts[1];
    return Math.min(1, secs / ub.book.total_duration_seconds);
  }
  return 0;
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
