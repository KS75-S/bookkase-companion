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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ub: UserBook;
}

export function AddMomentSheet({ open, onOpenChange, ub }: Props) {
  const mutation = useAddMoment();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  const submit = async () => {
    if (!note.trim()) return;
    await mutation.mutateAsync({
      bookId: ub.book_id,
      note: note.trim(),
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
              rows={7}
              className="bk-display min-h-[180px] resize-none rounded-xl border-border/70 bg-background text-[1.05rem] leading-relaxed"
            />
            <button
              className="bk-pill w-full text-base"
              onClick={submit}
              disabled={mutation.isPending || !note.trim()}
            >
              {mutation.isPending ? "Saving…" : "Save Moment"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
