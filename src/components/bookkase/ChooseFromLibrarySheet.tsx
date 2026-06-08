import { useMemo, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";

import { AddManualBookSheet } from "./AddManualBookSheet";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useLibraryBooks, useSetCurrentlyReading } from "@/lib/bookkase/queries";
import type { UserBook } from "@/lib/bookkase/types";
import { normalizeStatus } from "@/lib/bookkase/schema";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function statusLabel(ub: UserBook): string | null {
  const s = normalizeStatus(ub.status as unknown as string) ?? ub.status;
  switch (s) {
    case "reading":
      return "Currently Reading";
    case "listening":
      return "Currently Listening";
    case "rereading":
      return "Rereading";
    case "finished":
      return "Finished";
    case "dnf":
      return "Did Not Finish";
    default:
      return null;
  }
}

export function ChooseFromLibrarySheet({ open, onOpenChange }: Props) {
  const { data, isLoading, error, refetch } = useLibraryBooks();
  const setReading = useSetCurrentlyReading();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const all = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((ub) => {
      const t = ub.book?.title?.toLowerCase() ?? "";
      const a = ub.book?.author?.toLowerCase() ?? "";
      return t.includes(q) || a.includes(q);
    });
  }, [data, query]);

  const handleSelect = async (ub: UserBook) => {
    if (setReading.isPending) return;
    setPendingId(ub.id);
    try {
      await setReading.mutateAsync({ ub });
      onOpenChange(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error("[bookkase] set reading failed", err);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t bg-card p-0 max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden p-5">
          <SheetHeader className="px-0 text-left">
            <SheetTitle className="bk-display text-2xl">Choose from Library</SheetTitle>
            <SheetDescription className="text-sm">
              Set a book as currently reading.
            </SheetDescription>
          </SheetHeader>

          <div className="relative mt-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or author"
              className="pl-9"
            />
          </div>

          <div className="mt-4 flex-1 overflow-y-auto -mx-1 px-1">
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bk-card h-[72px] animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="bk-card p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  We couldn't load your library.
                </p>
                <button className="bk-pill mt-3" onClick={() => refetch()}>
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bk-card p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {data && data.length === 0
                    ? "Your library is empty. Add books in BookKase on your desktop."
                    : "No books match your search."}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((ub) => {
                  const label = statusLabel(ub);
                  const busy = pendingId === ub.id;
                  return (
                    <li key={ub.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(ub)}
                        disabled={busy}
                        className="bk-card flex w-full items-center gap-3 p-3 text-left transition disabled:opacity-60"
                      >
                        <div className="relative h-[64px] w-[44px] flex-none overflow-hidden rounded-md bg-[color:var(--surface-2)]">
                          {ub.book?.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ub.book.cover_url}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-muted-foreground">
                              <BookOpen size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="bk-display truncate text-[0.95rem] leading-snug text-foreground">
                            {ub.book?.title ?? "Untitled"}
                          </p>
                          {ub.book?.author ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {ub.book.author}
                            </p>
                          ) : null}
                          {label ? (
                            <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80">
                              {label}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {busy ? "Setting…" : "Set"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
