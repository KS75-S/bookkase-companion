import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Flame, RefreshCw } from "lucide-react";

import { fetchReadingStreak, type ReadingStreak } from "@/lib/bookkase/reading-streak";
import { CLERK_SUPABASE_TEMPLATE, getBookKaseBaseUrl } from "@/lib/bookkase/config";
import { Button } from "@/components/ui/button";

const DOT_COLORS = ["var(--streak-dot-1)", "var(--streak-dot-2)", "var(--streak-dot-3)"];
const DOT_OPACITY = [0.7, 0.8, 0.9];
const MAX_DOTS = 14;
type StreakState = "loading" | "ready" | "unauthorized" | "rateLimited" | "network" | "error";

export function StreakPill() {
  const { isSignedIn, getToken } = useAuth();
  const [streak, setStreak] = useState<ReadingStreak | null>(null);
  const [state, setState] = useState<StreakState>("loading");
  const backoffUntil = useRef(0);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!isSignedIn || inFlight.current) return;
    if (Date.now() < backoffUntil.current) return;
    inFlight.current = true;
    setState((currentState) => (streak ? currentState : "loading"));
    try {
      let sessionToken: string | null = null;
      try {
        sessionToken = await getToken();
      } catch {
        sessionToken = null;
      }

      const baseUrl = getBookKaseBaseUrl();
      let res = await fetchReadingStreak({ baseUrl, token: sessionToken });

      // The companion endpoint normally accepts the Clerk session token. If
      // its verifier expects the database JWT instead, retry that token once.
      if (!res.ok && res.kind === "unauthorized") {
        let databaseToken: string | null = null;
        try {
          databaseToken = await getToken({ template: CLERK_SUPABASE_TEMPLATE });
        } catch {
          databaseToken = null;
        }
        if (databaseToken && databaseToken !== sessionToken) {
          res = await fetchReadingStreak({ baseUrl, token: databaseToken });
        }
      }

      if (res.ok) {
        setStreak(res.streak);
        setState("ready");
      } else if (res.kind === "rateLimited") {
        backoffUntil.current = Date.now() + (res.retryAfterSeconds ?? 60) * 1000;
        setState("rateLimited");
      } else if (res.kind === "unauthorized") {
        setState("unauthorized");
      } else if (res.kind === "network") {
        setState("network");
      } else {
        setState("error");
      }
    } finally {
      inFlight.current = false;
    }
  }, [isSignedIn, getToken, streak]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const current = streak?.currentStreak ?? 0;
  const dots = Math.min(current, MAX_DOTS);
  const overflow = current > MAX_DOTS ? current - MAX_DOTS : 0;
  const label = `${current} day reading streak`;
  const hasConfirmedStreak = state === "ready";

  const failureMessage =
    state === "unauthorized"
      ? "Sign-in couldn't verify your streak"
      : state === "network"
        ? "Couldn't reach your streak"
        : state === "rateLimited"
          ? "Streak is temporarily unavailable"
          : state === "error"
            ? "Couldn't load your streak"
            : null;

  return (
    <div
      className="bk-card flex flex-wrap items-center justify-center px-4 py-3 text-center"
      style={{ gap: 8, minHeight: 44, fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif", fontSize: 15 }}
      aria-label={hasConfirmedStreak ? label : "Reading streak"}
      title={hasConfirmedStreak ? label : undefined}
      aria-live="polite"
    >
      <Flame size={15} strokeWidth={2.2} color="var(--streak-flame)" aria-hidden="true" />
      <span className="text-foreground" style={{ fontWeight: 600 }}>
        {hasConfirmedStreak ? `${current}d` : "—"}
      </span>
      {state === "loading" ? (
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>Loading streak…</span>
      ) : null}
      {hasConfirmedStreak && current === 0 ? (
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>
          Reading streak starts with your next update
        </span>
      ) : null}
      {failureMessage ? (
        <>
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{failureMessage}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => {
              backoffUntil.current = 0;
              void load();
            }}
            aria-label="Retry loading reading streak"
          >
            <RefreshCw aria-hidden="true" />
            Retry
          </Button>
        </>
      ) : null}
      {hasConfirmedStreak && dots > 0 ? (
        <span className="inline-flex items-center" style={{ gap: 4 }}>
          {Array.from({ length: dots }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                backgroundColor: DOT_COLORS[i % 3],
                opacity: DOT_OPACITY[i % 3],
              }}
            />
          ))}
          {overflow > 0 ? (
            <span style={{ fontSize: 10, fontWeight: 600, color: "#2A1E33" }}>+{overflow}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
