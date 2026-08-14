import { useEffect, useState, type KeyboardEvent } from "react";
import { useAuth } from "@clerk/clerk-react";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

import type { UserBook } from "@/lib/bookkase/types";
import { CLERK_SUPABASE_TEMPLATE, getBookKaseBaseUrl } from "@/lib/bookkase/config";
import {
  cleanValues,
  enqueueMetadata,
  hasAnyValue,
  patchBookMetadata,
  type BookMetadataFields,
} from "@/lib/bookkase/book-metadata";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ub: UserBook;
}

const SUGGESTIONS = {
  moods: ["Cozy", "Bittersweet", "Dark", "Hopeful", "Tense", "Whimsical"],
  tags: ["Slow burn", "Found family", "Forced proximity", "Dual POV", "Standalone"],
  tropes: ["Enemies to lovers", "Grumpy sunshine", "Second chance", "Chosen one"],
  contentWarnings: ["Grief", "Violence", "Self-harm", "Abuse", "Death of a parent"],
} as const;

function ChipInput({
  label,
  hint,
  values,
  onChange,
  suggestions,
  subdued,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (v: string[]) => void;
  suggestions: readonly string[];
  subdued?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const next = cleanValues([...values, ...raw.split(",")]);
    onChange(next);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draft.trim()) add(draft);
    } else if (e.key === "Backspace" && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const chipClass = subdued
    ? "bk-pill-ghost inline-flex items-center gap-1 text-xs opacity-80"
    : "bk-pill inline-flex items-center gap-1 text-xs";

  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <button key={v} type="button" className={chipClass} onClick={() => remove(v)}>
              {v}
              <X size={11} />
            </button>
          ))}
        </div>
      ) : null}
      <Input
        className="mt-2"
        value={draft}
        placeholder="Type and press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add(draft)}
      />
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {suggestions
          .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
          .map((s) => (
            <button
              key={s}
              type="button"
              className="bk-pill-ghost text-[11px] opacity-70"
              onClick={() => add(s)}
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

export function AddToBookSheet({ open, onOpenChange, ub }: Props) {
  const { getToken } = useAuth();
  const [moods, setMoods] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tropes, setTropes] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; action?: "signin" } | null>(null);

  useEffect(() => {
    if (open) {
      setMoods([]);
      setTags([]);
      setTropes([]);
      setWarnings([]);
      setError(null);
    }
  }, [open]);

  const fields: BookMetadataFields = {
    moods,
    tags,
    tropes,
    contentWarnings: warnings,
  };
  const canSave = hasAnyValue(fields);

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    let token: string | null = null;
    try {
      token = await getToken({ template: CLERK_SUPABASE_TEMPLATE });
    } catch {
      token = null;
    }

    const res = await patchBookMetadata({
      baseUrl: getBookKaseBaseUrl(),
      token,
      bookId: ub.book_id,
      fields,
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Saved to library ✓");
      onOpenChange(false);
      return;
    }

    switch (res.kind) {
      case "unauthorized":
        setError({ message: "Your session expired — sign in again.", action: "signin" });
        break;
      case "notFound":
        setError({ message: "This book is no longer available in your BookKase library." });
        break;
      case "rateLimited":
        setError({
          message: `Too many saves — try again in ${res.retryAfterSeconds ?? 30}s.`,
        });
        break;
      case "network":
        await enqueueMetadata({
          bookId: ub.book_id,
          bookTitle: ub.book?.title ?? null,
          fields,
        });
        toast("Saved offline — will sync when you're back");
        onOpenChange(false);
        break;
      case "notConfigured":
        setError({ message: "BookKase address isn't set — add it on Profile." });
        break;
      case "badRequest":
        setError({
          message: res.message
            ? `Couldn't save these details: ${res.message}`
            : "Couldn't save these details. Please try again.",
        });
        break;

      default:
        setError({ message: "Couldn't save these details. Please try again." });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-t bg-card p-0"
      >
        <div className="mx-auto max-w-md p-5">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="bk-display text-2xl">Add to Details</SheetTitle>
            <SheetDescription className="text-sm">
              {ub.book?.title ?? "Your book"} · these merge into your BookKase library.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5">
            <ChipInput
              label="Moods"
              values={moods}
              onChange={setMoods}
              suggestions={SUGGESTIONS.moods}
            />
            <ChipInput
              label="Tags"
              values={tags}
              onChange={setTags}
              suggestions={SUGGESTIONS.tags}
            />
            <ChipInput
              label="Tropes"
              values={tropes}
              onChange={setTropes}
              suggestions={SUGGESTIONS.tropes}
            />
            <ChipInput
              label="Content Warnings"
              hint="Kept gentle — only what readers should know going in."
              values={warnings}
              onChange={setWarnings}
              suggestions={SUGGESTIONS.contentWarnings}
              subdued
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-border bg-[color:var(--surface-2)]/60 p-3 text-sm">
              <p className="text-foreground">{error.message}</p>
              {error.action === "signin" ? (
                <a href="/sign-in" className="bk-pill mt-2 inline-block text-xs">
                  Sign in
                </a>
              ) : null}
            </div>
          ) : null}

          <button
            className="bk-pill mt-5 w-full text-sm disabled:opacity-50"
            onClick={submit}
            disabled={!canSave || saving}
          >
            {saving ? "Saving…" : "Save to library"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
