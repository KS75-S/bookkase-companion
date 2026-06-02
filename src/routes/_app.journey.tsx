import { createFileRoute } from "@tanstack/react-router";

import { useJourney } from "@/lib/bookkase/queries";
import { JourneyEntryCard } from "@/components/bookkase/JourneyEntry";
import type { JourneyEntry } from "@/lib/bookkase/types";

export const Route = createFileRoute("/_app/journey")({
  head: () => ({
    meta: [
      { title: "Journey — BookKase Companion" },
      { name: "description", content: "Your reading diary: moments, milestones, and progress over time." },
    ],
  }),
  component: JourneyPage,
});

function groupByDay(entries: JourneyEntry[]) {
  const groups = new Map<string, JourneyEntry[]>();
  for (const e of entries) {
    const day = new Date(e.created_at).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const list = groups.get(day) ?? [];
    list.push(e);
    groups.set(day, list);
  }
  return [...groups.entries()];
}

function JourneyPage() {
  const { data, isLoading, error, refetch } = useJourney(80);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bk-card h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bk-card mt-6 p-6 text-center">
        <p className="bk-display text-lg">Couldn't load your journey</p>
        <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
        <button className="bk-pill mt-4" onClick={() => refetch()}>Try again</button>
      </div>
    );
  }

  const entries = data ?? [];

  if (entries.length === 0) {
    return (
      <div className="bk-card mt-6 px-6 py-12 text-center">
        <h2 className="bk-display text-2xl text-foreground">Nothing recorded yet</h2>
        <p className="bk-accent mt-3 text-base text-muted-foreground">
          Updates and moments will collect here, like pages of a reading diary.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="bk-display text-[1.6rem] leading-tight text-foreground">Journey</h1>
        <p className="bk-accent mt-1 text-sm text-muted-foreground">
          a diary of your reading
        </p>
      </header>

      {groupByDay(entries).map(([day, items]) => (
        <section key={day}>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {day}
          </h2>
          <div className="space-y-3">
            {items.map((e) => (
              <JourneyEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
