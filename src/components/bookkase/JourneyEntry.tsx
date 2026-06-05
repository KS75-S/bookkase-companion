import { useState } from "react";
import { Trash2 } from "lucide-react";

import type { JourneyEntry } from "@/lib/bookkase/types";
import { useDeleteJourneyEntry } from "@/lib/bookkase/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function DeleteButton({
  entry,
  variant,
}: {
  entry: JourneyEntry;
  variant: "moment" | "compact";
}) {
  const [open, setOpen] = useState(false);
  const del = useDeleteJourneyEntry();

  const baseClass =
    variant === "moment"
      ? "ml-2 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
      : "ml-2 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50";

  return (
    <>
      <button
        type="button"
        aria-label="Delete entry"
        className={baseClass}
        disabled={del.isPending}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the entry from your journey. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(entry.id, {
                  onSettled: () => setOpen(false),
                });
              }}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function JourneyEntryCard({ entry }: { entry: JourneyEntry }) {
  const progress = formatProgress(entry);

  if (entry.entry_type === "moment") {
    return (
      <article className="bk-card p-5">
        <div className="flex items-start gap-2">
          <p className="bk-display flex-1 whitespace-pre-wrap text-[1.05rem] leading-relaxed text-foreground">
            “{entry.note}”
          </p>
          <DeleteButton entry={entry} variant="moment" />
        </div>
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
      <DeleteButton entry={entry} variant="compact" />
    </article>
  );
}
