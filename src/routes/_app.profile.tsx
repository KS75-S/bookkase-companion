import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { LogOut, RefreshCw } from "lucide-react";

import { ThemeToggle } from "@/components/bookkase/ThemeToggle";
import { useManualSync } from "@/lib/bookkase/queries";
import { getPendingCount, subscribeQueue } from "@/lib/bookkase/offline-queue";
import { getBookKaseBaseUrl, setBookKaseBaseUrl } from "@/lib/bookkase/config";
import { getPendingMetadataCount } from "@/lib/bookkase/book-metadata";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BookKase Companion" },
      { name: "description", content: "Your reading streak, sync status, and settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const sync = useManualSync();
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingMeta, setPendingMeta] = useState(0);
  const [baseUrl, setBaseUrl] = useState("");
  const [urlSaved, setUrlSaved] = useState(false);

  useEffect(() => {
    setBaseUrl(getBookKaseBaseUrl());
    getPendingMetadataCount().then(setPendingMeta);
  }, []);

  useEffect(() => {
    const refresh = () => getPendingCount().then(setPending);
    refresh();
    const off = subscribeQueue(refresh);
    const on = () => setOnline(true);
    const off2 = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off2);
    return () => {
      off();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off2);
    };
  }, []);

  const onSync = async () => {
    await sync.mutateAsync();
    setLastSyncedAt(new Date());
    setPending(await getPendingCount());
  };

  return (
    <div className="space-y-7">
      <header>
        <h1 className="bk-display text-[1.6rem] leading-tight text-foreground">Profile</h1>
        <p className="bk-accent mt-1 text-sm text-muted-foreground">your reading sanctuary</p>
      </header>

      <section className="bk-card p-5">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="h-14 w-14 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bk-ombre text-lg font-semibold text-white">
              {(user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "B").toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="bk-display truncate text-lg text-foreground">
              {user?.fullName ?? "Reader"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </section>

      <section className="bk-card p-5">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Sync
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  online ? "bg-[color:var(--indigo)]" : "bg-[color:var(--rose)]"
                }`}
              />
              {online ? "Online" : "Offline"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Pending writes</dt>
            <dd>{pending}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Pending book details</dt>
            <dd>{pendingMeta}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Last synced</dt>
            <dd>
              {lastSyncedAt
                ? lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </dd>
          </div>
        </dl>
        <button
          className="bk-pill mt-4 flex w-full items-center justify-center gap-2 text-sm"
          onClick={onSync}
          disabled={sync.isPending}
        >
          <RefreshCw size={14} className={sync.isPending ? "animate-spin" : ""} />
          {sync.isPending ? "Syncing…" : "Sync now"}
        </button>
      </section>

      <section className="bk-card p-5">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Light or dark mode
            <span className="block text-xs text-muted-foreground">
              Light reads like daylight. Dark reads like a twilight library.
            </span>
          </p>
          <ThemeToggle />
        </div>
      </section>

      <section className="bk-card p-5">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          BookKase library
        </h2>
        <p className="text-sm text-muted-foreground">
          Where your library lives. Details you add while reading are sent here.
        </p>
        <Input
          className="mt-3"
          value={baseUrl}
          placeholder="https://your-bookkase-site.com"
          inputMode="url"
          onChange={(e) => {
            setBaseUrl(e.target.value);
            setUrlSaved(false);
          }}
        />
        <button
          className="bk-pill mt-3 w-full text-sm"
          onClick={() => {
            setBookKaseBaseUrl(baseUrl);
            setBaseUrl(getBookKaseBaseUrl());
            setUrlSaved(true);
          }}
        >
          {urlSaved ? "Saved" : "Save address"}
        </button>
      </section>

      <section className="bk-card p-5">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          On desktop
        </h2>
        <p className="text-sm text-muted-foreground">
          Managing your library, collections, series, stats, and reading goals lives on
          BookKase for desktop. Companion is just for continuing the journey.
        </p>
      </section>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground"
        onClick={() => signOut({ redirectUrl: "/sign-in" })}
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  );
}
