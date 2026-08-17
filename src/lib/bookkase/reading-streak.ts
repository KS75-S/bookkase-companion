/**
 * Client for the BookKase companion reading-streak endpoint:
 *   GET {BOOKKASE_BASE_URL}/api/companion/reading-streak
 *
 * The web app owns the streak definition; we only render what it returns.
 */

export interface ReadingStreak {
  currentStreak: number;
  bestStreak: number;
  activityByDate: string[];
  activityMap: boolean[];
}

export type StreakResult =
  | { ok: true; streak: ReadingStreak }
  | {
      ok: false;
      kind: "unauthorized" | "rateLimited" | "network" | "notConfigured" | "unknown";
      status?: number;
      retryAfterSeconds?: number;
    };

export async function fetchReadingStreak(args: {
  baseUrl: string;
  token: string | null;
}): Promise<StreakResult> {
  const { baseUrl, token } = args;
  if (!token) return { ok: false, kind: "unauthorized" };
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) return { ok: false, kind: "notConfigured" };

  const url = `${baseUrl.replace(/\/+$/, "")}/api/companion/reading-streak`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    return { ok: false, kind: "network" };
  }

  if (res.ok) {
    try {
      const json = (await res.json()) as Partial<ReadingStreak>;
      return {
        ok: true,
        streak: {
          currentStreak: Number(json.currentStreak) || 0,
          bestStreak: Number(json.bestStreak) || 0,
          activityByDate: json.activityByDate ?? [],
          activityMap: json.activityMap ?? [],
        },
      };
    } catch {
      return { ok: false, kind: "unknown", status: res.status };
    }
  }

  if (res.status === 401) return { ok: false, kind: "unauthorized", status: 401 };
  if (res.status === 429) {
    const retry = parseInt(res.headers.get("Retry-After") ?? "", 10);
    return {
      ok: false,
      kind: "rateLimited",
      status: 429,
      retryAfterSeconds: Number.isFinite(retry) ? retry : 60,
    };
  }
  return { ok: false, kind: "unknown", status: res.status };
}
