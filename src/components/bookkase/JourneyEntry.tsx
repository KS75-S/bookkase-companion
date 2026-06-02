import type { JourneyEntry } from "@/lib/bookkase/types";

function formatProgress(e: JourneyEntry): string | null {
  if (!e.progress_value) return null;
  if (e.progress_type === "percentage") return `${parseInt(e.progress_value, 10)}%`;
  if (e.progress_type === "page") return `Page ${e.progress_value}`;
  if (e.progress_type === "chapter") return `Ch. ${e.progress_value}`;
  if (e.progress_type === "timestamp") return e.progress_value;
  return e.progress_value;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function JourneyEntryCard({ entry }: { entry: JourneyEntry }) {
  const progress = formatProgress(entry);

  if (entry.entry_type === "moment") {
    return (
      <article className="bk-card p-5">
        <p className="bk-display whitespace-pre-wrap text-[1.05rem] leading-relaxed text-foreground">
          “{entry.note}”
        </p>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {entry.book?.title ? (
            <span className="bk-accent text-[0.95rem] text-foreground/80">
              {entry.book.title}
            </span>
          ) : null}
          {progress ? <span>· {progress}</span> : null}
          <span className="ml-auto">{formatDate(entry.created_at)}</span>
        </div>
      </article>
    );
  }

  // progress / status / finished — quieter compact card
  const label =
    entry.entry_type === "finished"
      ? "Finished"
      : entry.entry_type === "status"
      ? "Status changed"
      : "Progress";

  return (
    <article className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bk-ombre text-[10px] font-semibold text-white">
        {label === "Finished" ? "✓" : label === "Progress" ? "↗" : "•"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          <span className="font-medium">{label}</span>
          {entry.book?.title ? <> · {entry.book.title}</> : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {progress ? `${progress} · ` : ""}
          {formatDate(entry.created_at)}
        </p>
      </div>
    </article>
  );
}
