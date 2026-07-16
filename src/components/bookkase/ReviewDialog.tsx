import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useSaveReview } from "@/lib/bookkase/queries";
import type { PersonalRating } from "@/lib/bookkase/moment-types";
import {
  PersonalRatingInput,
  SpiceRatingInput,
} from "./RatingWidgets";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** The finished journey entry id we should attach the review to. */
  entryId: string;
  bookTitle?: string | null;
}

type Step = "prompt" | "form";

export function ReviewDialog({ open, onOpenChange, entryId, bookTitle }: Props) {
  const saveReview = useSaveReview();
  const [step, setStep] = useState<Step>("prompt");
  const [rating, setRating] = useState<PersonalRating | null>(null);
  const [spice, setSpice] = useState<number | null>(null);
  const [review, setReview] = useState("");

  useEffect(() => {
    if (open) {
      setStep("prompt");
      setRating(null);
      setSpice(null);
      setReview("");
    }
  }, [open]);

  const handleLater = async () => {
    await saveReview.mutateAsync({ entryId, needsReview: true });
    onOpenChange(false);
  };

  const handleSaveNow = async () => {
    await saveReview.mutateAsync({
      entryId,
      needsReview: false,
      rating,
      spice,
      review: review.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="bk-display text-xl">
            {step === "prompt" ? "Add a review?" : "Your review"}
          </DialogTitle>
          <DialogDescription>
            {bookTitle ? `You finished ${bookTitle}. ` : "You finished this book. "}
            {step === "prompt"
              ? "Capture your rating and thoughts now, or come back to it later."
              : "Rate the book and jot down anything you'd like to remember."}
          </DialogDescription>
        </DialogHeader>

        {step === "prompt" ? (
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              className="bk-pill-ghost"
              onClick={handleLater}
              disabled={saveReview.isPending}
            >
              {saveReview.isPending ? "Saving…" : "Later"}
            </button>
            <button
              type="button"
              className="bk-pill"
              onClick={() => setStep("form")}
              disabled={saveReview.isPending}
            >
              Add now
            </button>
          </DialogFooter>
        ) : (
          <>
            <div className="space-y-5">
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
                  rows={5}
                  className="bk-display resize-none rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button
                type="button"
                className="bk-pill-ghost"
                onClick={handleLater}
                disabled={saveReview.isPending}
              >
                Save for later
              </button>
              <button
                type="button"
                className="bk-pill"
                onClick={handleSaveNow}
                disabled={saveReview.isPending}
              >
                {saveReview.isPending ? "Saving…" : "Save review"}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
