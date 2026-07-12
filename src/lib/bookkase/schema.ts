/**
 * Single source of truth for BookKase table + column names.
 *
 * Adjust these if your actual Supabase schema uses different names.
 * Everything in the app reads through this map so renames are one-line fixes.
 */

export const TABLES = {
  books: "books",
  userBooks: "user_books",
  journey: "reading_journey",
  readingPlan: "reading_plan",
} as const;

/**
 * Explicit projection for the `books` table. The BookKase schema stores page
 * count as `pages` (not `total_pages`), and does NOT have chapter-count or
 * audio-duration columns — so we alias `pages` to `total_pages` and leave the
 * chapter/duration fields undefined (consumers already handle them being null).
 */
export const BOOK_COLUMNS = "id,title,author,cover,total_pages:pages";

/** Storage bucket that holds user-uploaded book cover images. */
export const COVERS_BUCKET = "covers";


export type BookStatus = "reading" | "listening" | "finished" | "dnf" | "rereading";
export type ProgressType = "percentage" | "page" | "chapter" | "timestamp";
export type JourneyEntryType = "moment" | "progress" | "status" | "finished";

export const ACTIVE_STATUSES: BookStatus[] = ["reading", "listening", "rereading"];

/**
 * Status values to send to Supabase `.in()` — includes both canonical
 * Companion values and legacy/display values used by the BookKase web app.
 */
export const ACTIVE_STATUS_VALUES: string[] = [
  "reading",
  "listening",
  "rereading",
  "Currently Reading",
  "Currently Listening",
  "Rereading",
];

export const COMPANION_SOURCE = "companion";

/**
 * Normalize a status string (canonical or legacy/display) into the
 * Companion's canonical BookStatus. Returns null for unrecognized values.
 */
export function normalizeStatus(raw: string | null | undefined): BookStatus | null {
  if (!raw) return null;
  const s = raw.toString().trim().toLowerCase().replace(/^currently\s+/, "");
  switch (s) {
    case "reading":
      return "reading";
    case "listening":
      return "listening";
    case "rereading":
    case "re-reading":
      return "rereading";
    case "finished":
    case "read":
      return "finished";
    case "dnf":
    case "did not finish":
      return "dnf";
    default:
      return null;
  }
}
