import { createFileRoute } from "@tanstack/react-router";

import { useActiveBooks } from "@/lib/bookkase/queries";
import { BookCard } from "@/components/bookkase/BookCard";
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

function EmptyState() {
  return (
    <div className="bk-card mt-6 px-6 py-12 text-center">
      <h2 className="bk-display text-2xl text-foreground">Your story begins here</h2>
      <p className="bk-accent mt-3 text-base text-muted-foreground">
        Books you're reading or listening to will appear here.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Add books from BookKase on your desktop. Companion is for continuing the journey.
      </p>
    </div>
  );
}

function ReadingPage() {
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
    return (
      <div className="bk-card mt-6 p-6 text-center">
        <p className="bk-display text-lg">We couldn't reach your library</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error).message}
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

  if (books.length === 0) return <EmptyState />;

  return (
    <div>
      <Section title="Currently Reading" books={reading} />
      <Section title="Currently Listening" books={listening} />
    </div>
  );
}
