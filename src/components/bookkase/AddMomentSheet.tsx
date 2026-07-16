import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import type { UserBook } from "@/lib/bookkase/types";
import { useAddMoment } from "@/lib/bookkase/queries";
import { PORTRAIT_TAGS } from "@/lib/bookkase/portrait-tags";
import { ExpansionArtifactIcon } from "@/lib/bookkase/expansion-artifacts";
import { MOMENT_TYPES, type MomentType } from "@/lib/bookkase/moment-types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ub: UserBook;
}

export function AddMomentSheet({ open, onOpenChange, ub }: Props) {
  const mutation = useAddMoment();
  const [note, setNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [momentType, setMomentType] = useState<MomentType | "">("");
  const [spoiler, setSpoiler] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setNote("");
      setSelectedIds([]);
      setMomentType("");
      setSpoiler(false);
      setTagsOpen(false);
    }
  }, [open]);

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
    );

  const submit = async () => {
    if (!note.trim() && selectedIds.length === 0) return;
    await mutation.mutateAsync({
      bookId: ub.book_id,
      note: note.trim(),
      tags: selectedIds,
      progressType: (ub.progress_type as never) ?? null,
      progressValue: ub.progress_value ?? null,
      momentType: momentType || null,
      spoiler,
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

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Moment type <span className="normal-case tracking-normal text-muted-foreground/70">(optional)</span>
              </Label>
              <Select
                value={momentType}
                onValueChange={(v) => setMomentType(v as MomentType)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pick a type…" />
                </SelectTrigger>
                <SelectContent>
                  {MOMENT_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2.5">
              <Checkbox
                checked={spoiler}
                onCheckedChange={(v) => setSpoiler(v === true)}
                id="spoiler"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">Spoiler</span>
                <span className="block text-xs text-muted-foreground">
                  Blur this moment in Journey until tapped to reveal.
                </span>
              </span>
            </label>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Reading Portrait Tags
              </p>
              <div className="grid grid-cols-5 gap-2">
                {PORTRAIT_TAGS.map((t) => {
                  const active = selectedIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggle(t.id)}
                      aria-pressed={active}
                      title={t.subtitle}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                        active
                          ? "border-foreground/60 bg-foreground/5 text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ExpansionArtifactIcon
                        id={t.id}
                        className="h-9 w-9"
                        aria-hidden="true"
                      />
                      <span className="text-[10px] leading-tight">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>


            <button
              className="bk-pill w-full text-base"
              onClick={submit}
              disabled={mutation.isPending || (!note.trim() && selectedIds.length === 0)}
            >
              {mutation.isPending ? "Saving…" : "Save Moment"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
