import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookPlus, CalendarDays } from "lucide-react";

import { useActiveBooks } from "@/lib/bookkase/queries";
import { BookCard } from "@/components/bookkase/BookCard";
import { ChooseFromLibrarySheet } from "@/components/bookkase/ChooseFromLibrarySheet";
import { ChooseFromPlanSheet } from "@/components/bookkase/ChooseFromPlanSheet";
import type { UserBook } from "@/lib/bookkase/types";

export const Route = createFileRoute("/_app/reading")({
  head: () => ({
    meta: [
      { title: "Reading — BookKase Companion" },
      { name: "description", content: "Continue your current reads and listens." },
    ],
  }),
  component: ReadingPage,
});

function Section({
  title,
  subtitle,
  books,
}: {
  title: string;
  subtitle?: string;
  books: UserBook[];
}) {
  if (books.length === 0) return null;
  return (
    <section className="mb-8">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="bk-display text-[1.4rem] leading-tight text-foreground">{title}</h2>
        {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
      </header>
      <div className="space-y-4">
        {books.map((ub) => (
          <BookCard key={ub.id} ub={ub} />
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="bk-card mt-6 px-6 py-12 text-center">
      <h2 className="bk-display text-2xl text-foreground">Nothing in progress yet</h2>
      <p className="bk-accent mt-3 text-base text-muted-foreground">
        Choose a book from your library to start tracking your reading.
      </p>
      <button className="bk-pill mt-5 inline-flex items-center gap-1.5" onClick={onChoose}>
        <BookPlus size={14} />
        Choose from Library
      </button>
    </div>
  );
}

function ReadingPage() {
  const [chooseOpen, setChooseOpen] = useState(false);
  const { data, isLoading, error, refetch } = useActiveBooks();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="bk-card h-[200px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    if (import.meta.env.DEV) console.error("[bookkase] reading load error", error);
    return (
      <div className="bk-card mt-6 p-6 text-center">
        <p className="bk-display text-lg">We couldn't reach your library</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong loading your books. Please try again.
        </p>
        <button className="bk-pill mt-4" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const books = data ?? [];
  const reading = books.filter((b) => b.status === "reading" || b.status === "rereading");
  const listening = books.filter((b) => b.status === "listening");

  return (
    <div>
      {books.length === 0 ? (
        <EmptyState onChoose={() => setChooseOpen(true)} />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button
              className="bk-pill-ghost inline-flex items-center gap-1.5 text-sm"
              onClick={() => setChooseOpen(true)}
            >
              <BookPlus size={14} />
              Choose from Library
            </button>
          </div>
          <Section title="Currently Reading" books={reading} />
          <Section title="Currently Listening" books={listening} />
        </>
      )}

      <ChooseFromLibrarySheet open={chooseOpen} onOpenChange={setChooseOpen} />
    </div>
  );
}
