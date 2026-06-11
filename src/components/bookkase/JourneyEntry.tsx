import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import type { JourneyEntry } from "@/lib/bookkase/types";
import { useDeleteJourneyEntry, useUpdateJourneyEntry } from "@/lib/bookkase/queries";
import {
  encodeNoteWithTags,
  parseNoteTags,
  tagByName,
  PORTRAIT_TAGS,
} from "@/lib/bookkase/portrait-tags";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const iconButtonClass =
  "inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50";

function EditEntryDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: JourneyEntry;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateJourneyEntry();
  const initial = parseNoteTags(entry.note);
  const [note, setNote] = useState(initial.text);
  const [selectedTags, setSelectedTags] = useState<string[]>(initial.tags);
  const [progressValue, setProgressValue] = useState(entry.progress_value ?? "");

  useEffect(() => {
    if (open) {
      const parsed = parseNoteTags(entry.note);
      setNote(parsed.text);
      setSelectedTags(parsed.tags);
      setProgressValue(entry.progress_value ?? "");
    }
  }, [open, entry]);

  const hasNote = entry.entry_type === "moment";
  const hasProgress = !!entry.progress_type;

  const toggleTag = (name: string) =>
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const submit = () => {
    const encoded = hasNote ? encodeNoteWithTags(note, selectedTags) : null;
    update.mutate(
      {
        entryId: entry.id,
        ...(hasNote ? { note: encoded || null } : {}),
        ...(hasProgress ? { progressValue: progressValue.trim() || null } : {}),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const progressLabel =
    entry.progress_type === "percentage"
      ? "Progress (%)"
      : entry.progress_type === "page"
      ? "Page"
      : entry.progress_type === "chapter"
      ? "Chapter"
      : entry.progress_type === "timestamp"
      ? "Timestamp"
      : "Progress";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="bk-display text-xl">Edit entry</DialogTitle>
          <DialogDescription>
            {entry.book?.title ?? "Update this entry"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {hasNote ? (
            <div className="space-y-2">
              <Label htmlFor="entry-note">Note</Label>
              <Textarea
                id="entry-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className="bk-display min-h-[140px] resize-none rounded-xl"
                placeholder="What are you thinking?"
              />
            </div>
          ) : null}
          {hasProgress ? (
            <div className="space-y-2">
              <Label htmlFor="entry-progress">{progressLabel}</Label>
              <Input
                id="entry-progress"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder={entry.progress_type === "timestamp" ? "1:23:45" : "0"}
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <button
            type="button"
            className="bk-pill bk-pill-ghost"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bk-pill"
            onClick={submit}
            disabled={update.isPending || (hasNote && !note.trim())}
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntryActions({ entry }: { entry: JourneyEntry }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const del = useDeleteJourneyEntry();

  const canEdit = entry.entry_type === "moment" || !!entry.progress_type;

  return (
    <div className="ml-2 flex flex-none items-center gap-1">
      {canEdit ? (
        <button
          type="button"
          aria-label="Edit entry"
          className={iconButtonClass}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Delete entry"
        className={iconButtonClass}
        disabled={del.isPending}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {canEdit ? (
        <EditEntryDialog entry={entry} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
                  onSettled: () => setDeleteOpen(false),
                });
              }}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
          <EntryActions entry={entry} />
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
      <EntryActions entry={entry} />
    </article>
  );
}
