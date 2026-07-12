import { useMemo, useState } from "react";
import { BookOpen, CalendarDays } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  useActiveBooks,
  useReadingPlan,
  useSetCurrentlyReadingByBookId,
} from "@/lib/bookkase/queries";
import type { ReadingPlanEntry } from "@/lib/bookkase/types";
import { useSupabase } from "@/lib/bookkase/supabase-provider";
import { resolveCoverUrl } from "@/lib/bookkase/covers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthLabel(year: number, month: number): string {
  const name = MONTH_NAMES[Math.max(1, Math.min(12, month)) - 1] ?? `Month ${month}`;
  return `${name} ${year}`;
}

interface Group {
  key: string;
  year: number;
  month: number;
  entries: ReadingPlanEntry[];
}

function groupByMonth(entries: ReadingPlanEntry[]): Group[] {
  const map = new Map<string, Group>();
  for (const e of entries) {
    const key = `${e.scheduled_year}-${String(e.scheduled_month).padStart(2, "0")}`;
    let g = map.get(key);
    if (!g) {
      g = { key, year: e.scheduled_year, month: e.scheduled_month, entries: [] };
      map.set(key, g);
    }
    g.entries.push(e);
  }
  // Chronological ascending, matching the ORDER BY from the query.
  return Array.from(map.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  );
}

export function ChooseFromPlanSheet({ open, onOpenChange }: Props) {
  const { data, isLoading, error, refetch } = useReadingPlan();
  const { data: active } = useActiveBooks();
  const setReading = useSetCurrentlyReadingByBookId();
  const supabase = useSupabase();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const activeBookIds = useMemo(() => {
    const s = new Set<string>();
    for (const ub of active ?? []) {
      if (ub.status === "reading" || ub.status === "listening" || ub.status === "rereading") {
        s.add(ub.book_id);
      }
    }
    return s;
  }, [active]);

  const groups = useMemo(() => groupByMonth(data ?? []), [data]);

  const handleSelect = async (entry: ReadingPlanEntry) => {
    if (setReading.isPending) return;
    setPendingId(entry.id);
    try {
      const isAudio = !!entry.book?.total_duration_seconds;
      await setReading.mutateAsync({ bookId: entry.book_id, isAudio });
      onOpenChange(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error("[bookkase] set from plan failed", err);
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
            <SheetTitle className="bk-display text-2xl">Choose from Plan</SheetTitle>
            <SheetDescription className="text-sm">
              Pick a book from your monthly reading plan.
            </SheetDescription>
          </SheetHeader>

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
                  We couldn't load your reading plan.
                </p>
                <button className="bk-pill mt-3" onClick={() => refetch()}>
                  Try again
                </button>
              </div>
            ) : groups.length === 0 ? (
              <div className="bk-card p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Your reading plan is empty. Add books to your plan in BookKase.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {groups.map((g) => (
                  <section key={g.key}>
                    <header className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-muted-foreground">
                      <CalendarDays size={12} />
                      {monthLabel(g.year, g.month)}
                    </header>
                    <ul className="space-y-2">
                      {g.entries.map((entry) => {
                        const isActive = activeBookIds.has(entry.book_id);
                        const busy = pendingId === entry.id;
                        const coverUrl = resolveCoverUrl(supabase, entry.book?.cover);
                        return (
                          <li key={entry.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(entry)}
                              disabled={busy || isActive}
                              className="bk-card flex w-full items-center gap-3 p-3 text-left transition disabled:opacity-60"
                            >
                              <div className="relative h-[64px] w-[44px] flex-none overflow-hidden rounded-md bg-[color:var(--surface-2)]">
                                {coverUrl ? (
                                  <img
                                    src={coverUrl}
                                    alt={
                                      entry.book?.title
                                        ? `Cover of ${entry.book.title}`
                                        : "Book cover"
                                    }
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
                                  {entry.book?.title ?? "Untitled"}
                                </p>
                                {entry.book?.author ? (
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {entry.book.author}
                                  </p>
                                ) : null}
                                {isActive ? (
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80">
                                    Already Reading
                                  </p>
                                ) : null}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {isActive ? "—" : busy ? "Setting…" : "Set"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
