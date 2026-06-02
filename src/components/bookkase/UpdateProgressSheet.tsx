import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { UserBook } from "@/lib/bookkase/types";
import type { BookStatus, ProgressType } from "@/lib/bookkase/schema";
import { useUpdateProgress } from "@/lib/bookkase/queries";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ub: UserBook;
}

export function UpdateProgressSheet({ open, onOpenChange, ub }: Props) {
  const mutation = useUpdateProgress();
  const [status, setStatus] = useState<BookStatus>(ub.status);
  const [progressType, setProgressType] = useState<ProgressType>(
    (ub.progress_type as ProgressType) ?? (ub.status === "listening" ? "timestamp" : "percentage")
  );
  const [progressValue, setProgressValue] = useState<string>(ub.progress_value ?? "");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setStatus(ub.status);
      setProgressType(
        (ub.progress_type as ProgressType) ??
          (ub.status === "listening" ? "timestamp" : "percentage")
      );
      setProgressValue(ub.progress_value ?? "");
      setNote("");
    }
  }, [open, ub]);

  const submit = async () => {
    await mutation.mutateAsync({
      bookId: ub.book_id,
      status,
      progressType,
      progressValue,
      note: note.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t bg-card p-0">
        <div className="mx-auto max-w-md p-5">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="bk-display text-2xl">Update Progress</SheetTitle>
            <SheetDescription className="text-sm">
              {ub.book?.title ?? "Your book"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="listening">Listening</SelectItem>
                  <SelectItem value="rereading">Rereading</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="dnf">Did Not Finish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Progress type</Label>
                <Select
                  value={progressType}
                  onValueChange={(v) => setProgressType(v as ProgressType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="chapter">Chapter</SelectItem>
                    <SelectItem value="timestamp">Timestamp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  placeholder={
                    progressType === "timestamp"
                      ? "01:14:22"
                      : progressType === "percentage"
                      ? "42"
                      : "—"
                  }
                  inputMode={progressType === "timestamp" ? "text" : "numeric"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Note <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A line about where you left off…"
                rows={3}
                className="bk-accent text-base leading-relaxed"
              />
            </div>

            <button
              className="bk-pill mt-2 w-full text-base"
              onClick={submit}
              disabled={mutation.isPending || !progressValue.trim()}
            >
              {mutation.isPending ? "Saving…" : "Save Update"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
