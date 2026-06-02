/**
 * Single source of truth for BookKase table + column names.
 *
 * Adjust these if your actual Supabase schema uses different names.
 * Everything in the app reads through this map so renames are one-line fixes.
 *
 * Assumed shape (correct here if it differs):
 *
 *   books(
 *     id uuid pk,
 *     title text,
 *     author text,
 *     cover_url text,
 *     total_pages int,
 *     total_duration_seconds int,
 *     chapters jsonb | null
 *   )
 *
 *   user_books(
 *     id uuid pk,
 *     user_id text,                 -- Clerk user id (sub claim)
 *     book_id uuid references books(id),
 *     status text check (status in
 *       ('reading','listening','finished','dnf','rereading')),
 *     progress_type text check (progress_type in
 *       ('percentage','page','chapter','timestamp')),
 *     progress_value text,          -- stored as text for flexibility
 *     updated_at timestamptz
 *   )
 *
 *   reading_journey(
 *     id uuid pk,                   -- generated client-side for dedupe
 *     user_id text,
 *     book_id uuid references books(id),
 *     source text,                  -- 'companion' from this app
 *     entry_type text check (entry_type in
 *       ('moment','progress','status','finished')),
 *     progress_type text | null,
 *     progress_value text | null,
 *     note text | null,
 *     created_at timestamptz default now(),
 *     updated_at timestamptz default now()
 *   )
 */

export const TABLES = {
  books: "books",
  userBooks: "user_books",
  journey: "reading_journey",
} as const;

export type BookStatus = "reading" | "listening" | "finished" | "dnf" | "rereading";
export type ProgressType = "percentage" | "page" | "chapter" | "timestamp";
export type JourneyEntryType = "moment" | "progress" | "status" | "finished";

export const ACTIVE_STATUSES: BookStatus[] = ["reading", "listening", "rereading"];
export const COMPANION_SOURCE = "companion";
