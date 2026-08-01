import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

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
import type { PersonalRating } from "@/lib/bookkase/moment-types";
import { useSaveReview, useUpdateProgress } from "@/lib/bookkase/queries";
import { PersonalRatingInput, SpiceRatingInput } from "./RatingWidgets";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ub: UserBook;
}


/** Does this progress update indicate the user finished the book? */
function isFinishingUpdate(
  status: BookStatus,
  progressType: ProgressType,
  progressValue: string,
): boolean {
  if (status === "finished") return true;
  if (progressType === "percentage") {
    const n = parseFloat(progressValue);
    return Number.isFinite(n) && n >= 100;
  }
  return false;
}

export function UpdateProgressSheet({ open, onOpenChange, ub }: Props) {
  const mutation = useUpdateProgress();
  const saveReview = useSaveReview();
  const [status, setStatus] = useState<BookStatus>(ub.status);
  const [progressType, setProgressType] = useState<ProgressType>(
    (ub.progress_type as ProgressType) ?? (ub.status === "listening" ? "timestamp" : "percentage")
  );
  const [progressValue, setProgressValue] = useState<string>(ub.progress_value ?? "");
  const [note, setNote] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState<PersonalRating | null>(null);
  const [spice, setSpice] = useState<number | null>(null);
  const [review, setReview] = useState("");

  useEffect(() => {
    if (open) {
      setStatus(ub.status);
      setProgressType(
        (ub.progress_type as ProgressType) ??
          (ub.status === "listening" ? "timestamp" : "percentage")
      );
      setProgressValue(ub.progress_value ?? "");
      setNote("");
      setShowReview(false);
      setRating(null);
      setSpice(null);
      setReview("");
    }
  }, [open, ub]);

  const busy = mutation.isPending || saveReview.isPending;

  const submit = async () => {
    const willFinish = isFinishingUpdate(status, progressType, progressValue);
    // Normalize status to `finished` so downstream (offline queue → journey
    // entry_type) writes a proper finished record we can attach a review to.
    const effectiveStatus: BookStatus = willFinish || showReview ? "finished" : status;

    const result = await mutation.mutateAsync({
      bookId: ub.book_id,
      status: effectiveStatus,
      progressType,
      progressValue,
      note: note.trim() || null,
    });

    if (showReview && result?.id) {
      const hasReview =
        rating !== null || spice !== null || review.trim().length > 0;
      try {
        await saveReview.mutateAsync({
          entryId: result.id,
          needsReview: !hasReview,
          rating,
          spice,
          review: review.trim() ? review.trim() : undefined,
        });
      } catch (err) {
        if (import.meta.env.DEV) console.error("[bookkase] review save failed", err);
      }
    }

    onOpenChange(false);
  };


  return (
    <>
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

              {!showReview ? (
                <button
                  type="button"
                  className="bk-pill-ghost inline-flex w-full items-center justify-center gap-1.5 text-sm"
                  onClick={() => setShowReview(true)}
                >
                  <Sparkles size={14} />
                  Ready to Review?
                </button>
              ) : (
                <div className="space-y-5 rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="bk-display text-lg">Your review</p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => setShowReview(false)}
                    >
                      Not yet
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Personal Rating
                    </Label>
                    <PersonalRatingInput value={rating} onChange={setRating} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Spice Rating
                    </Label>
                    <SpiceRatingInput value={spice} onChange={setSpice} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review-text">
                      Review <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="review-text"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="What stayed with you?"
                      rows={4}
                      className="bk-display resize-none rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saving marks this book as finished.
                  </p>
                </div>
              )}

              <button
                className="bk-pill mt-2 w-full text-base"
                onClick={submit}
                disabled={busy || !progressValue.trim()}
              >
                {busy ? "Saving…" : showReview ? "Save Update & Review" : "Save Update"}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

