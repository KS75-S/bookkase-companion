import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useAddManualBook } from "@/lib/bookkase/queries";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded?: () => void;
}

type Format = "pages" | "time";
type IdType = "isbn" | "asin" | "goodreads";

export function AddManualBookSheet({ open, onOpenChange, onAdded }: Props) {
  const addBook = useAddManualBook();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [format, setFormat] = useState<Format>("pages");
  const [pages, setPages] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [idType, setIdType] = useState<IdType>("isbn");
  const [idValue, setIdValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setAuthor("");
    setFormat("pages");
    setPages("");
    setHours("");
    setMinutes("");
    setIdType("isbn");
    setIdValue("");
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!title.trim() || !author.trim()) {
      setErrorMsg("Please enter both a title and an author.");
      return;
    }

    let totalPages: number | null = null;
    let totalDurationSeconds: number | null = null;
    if (format === "pages") {
      const p = parseInt(pages, 10);
      if (!Number.isFinite(p) || p <= 0) {
        setErrorMsg("Enter a valid total number of pages.");
        return;
      }
      totalPages = p;
    } else {
      const h = parseInt(hours || "0", 10);
      const m = parseInt(minutes || "0", 10);
      const seconds = (Number.isFinite(h) ? h : 0) * 3600 + (Number.isFinite(m) ? m : 0) * 60;
      if (seconds <= 0) {
        setErrorMsg("Enter a valid total time.");
        return;
      }
      totalDurationSeconds = seconds;
    }

    const id = idValue.trim();
    try {
      await addBook.mutateAsync({
        title,
        author,
        totalPages,
        totalDurationSeconds,
        isbn: idType === "isbn" ? id || null : null,
        asin: idType === "asin" ? id || null : null,
        goodreadsId: idType === "goodreads" ? id || null : null,
        setCurrentlyReading: true,
      });
      reset();
      onOpenChange(false);
      onAdded?.();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong adding your book.";
      setErrorMsg(msg);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setErrorMsg(null);
        onOpenChange(v);
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t bg-card p-0 max-h-[90vh] overflow-hidden flex flex-col"
      >
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden p-5"
        >
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="bk-display text-2xl">Add a Book</SheetTitle>
            <SheetDescription className="text-sm">
              Add a book that isn't in your library yet.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto -mx-1 px-1">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Name of the Wind"
                maxLength={300}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Author
              </label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Patrick Rothfuss"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("pages")}
                  className={`bk-pill ${format === "pages" ? "" : "bk-pill-ghost"}`}
                >
                  Pages
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("time")}
                  className={`bk-pill ${format === "time" ? "" : "bk-pill-ghost"}`}
                >
                  Time
                </button>
              </div>
            </div>

            {format === "pages" ? (
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Total pages
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100000}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="722"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Total time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={500}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="Hours"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="Minutes"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Identifier (optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["isbn", "ISBN"],
                    ["asin", "ASIN"],
                    ["goodreads", "Goodreads"],
                  ] as Array<[IdType, string]>
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setIdType(k)}
                    className={`bk-pill text-xs ${idType === k ? "" : "bk-pill-ghost"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Input
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                placeholder={
                  idType === "isbn"
                    ? "9780756404079"
                    : idType === "asin"
                    ? "B0036S4B2G"
                    : "186074"
                }
                maxLength={64}
              />
              <p className="text-[11px] text-muted-foreground">
                Helps link this entry if the book is added to BookKase later.
              </p>
            </div>

            {errorMsg ? (
              <p className="text-sm text-destructive">{errorMsg}</p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="bk-pill-ghost"
              onClick={() => onOpenChange(false)}
              disabled={addBook.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bk-pill"
              disabled={addBook.isPending}
            >
              {addBook.isPending ? "Adding…" : "Add Book"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
