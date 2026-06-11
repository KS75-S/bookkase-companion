import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import type { UserBook } from "@/lib/bookkase/types";
import { useAddMoment } from "@/lib/bookkase/queries";
import { PORTRAIT_TAGS, encodeNoteWithTags } from "@/lib/bookkase/portrait-tags";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ub: UserBook;
}

export function AddMomentSheet({ open, onOpenChange, ub }: Props) {
  const mutation = useAddMoment();
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setNote("");
      setSelected([]);
    }
  }, [open]);

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const submit = async () => {
    if (!note.trim() && selected.length === 0) return;
    await mutation.mutateAsync({
      bookId: ub.book_id,
      note: encodeNoteWithTags(note, selected),
      progressType: (ub.progress_type as never) ?? null,
      progressValue: ub.progress_value ?? null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t bg-card p-0">
        <div className="mx-auto max-w-md p-5">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="bk-display text-2xl">A reading moment</SheetTitle>
            <SheetDescription className="text-sm">
              {ub.book?.title ?? "Your book"}
              {ub.progress_value ? (
                <> · <span className="bk-accent">{ub.progress_value}{ub.progress_type === "percentage" ? "%" : ""}</span></>
              ) : null}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What are you thinking?"
              rows={6}
              className="bk-display min-h-[150px] resize-none rounded-xl border-border/70 bg-background text-[1.05rem] leading-relaxed"
            />

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Reading Portrait Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {PORTRAIT_TAGS.map((t) => {
                  const active = selected.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggle(t.name)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                        active
                          ? "border-foreground/60 bg-foreground/5 text-foreground"
                          : "border-border/70 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <img src={t.icon} alt="" className="h-5 w-5 object-contain" />
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="bk-pill w-full text-base"
              onClick={submit}
              disabled={mutation.isPending || (!note.trim() && selected.length === 0)}
            >
              {mutation.isPending ? "Saving…" : "Save Moment"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
