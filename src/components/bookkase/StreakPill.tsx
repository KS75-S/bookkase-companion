import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Flame } from "lucide-react";

import { fetchReadingStreak, type ReadingStreak } from "@/lib/bookkase/reading-streak";
import { CLERK_SUPABASE_TEMPLATE, getBookKaseBaseUrl } from "@/lib/bookkase/config";

const DOT_COLORS = ["#8C4577", "#F0748F", "#399282"];
const DOT_OPACITY = [0.7, 0.8, 0.9];
const MAX_DOTS = 14;

export function StreakPill() {
  const { isSignedIn, getToken } = useAuth();
  const [streak, setStreak] = useState<ReadingStreak | null>(null);
  const backoffUntil = useRef(0);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!isSignedIn || inFlight.current) return;
    if (Date.now() < backoffUntil.current) return;
    inFlight.current = true;
    try {
      let token: string | null = null;
      try {
        token = await getToken();
        if (!token) token = await getToken({ template: CLERK_SUPABASE_TEMPLATE });
      } catch {
        token = null;
      }
      const res = await fetchReadingStreak({ baseUrl: getBookKaseBaseUrl(), token });
      if (res.ok) {
        setStreak(res.streak);
      } else if (res.kind === "rateLimited") {
        backoffUntil.current = Date.now() + (res.retryAfterSeconds ?? 60) * 1000;
      }
      // 401 / network / 5xx: keep the last known value, retry on next foreground.
    } finally {
      inFlight.current = false;
    }
  }, [isSignedIn, getToken]);

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

  return (
    <div
      className="inline-flex items-center"
      style={{ gap: 8, minHeight: 44, fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif", fontSize: 15 }}
      aria-label={label}
      title={label}
    >
      <Flame size={15} strokeWidth={2.2} color="#8C4577" aria-hidden="true" />
      <span className="text-foreground" style={{ fontWeight: 600 }}>{current}d</span>
      {current === 0 ? (
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>
          Reading streak starts with your next update
        </span>
      ) : null}
      {dots > 0 ? (
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
