# BookKase Companion — Stabilization Pass

Scope: stability, schema alignment, and data integrity only. No UI/styling changes.

**Please also verify that normalizeStatus() is used before the Reading page splits books into reading/listening, so UI filters don't rely on legacy display strings.**

## Files to change

1. `src/lib/bookkase/offline-queue.ts`
2. `src/lib/bookkase/queries.ts`
3. `src/lib/bookkase/schema.ts`
4. `src/routes/_app.reading.tsx`
5. `src/lib/bookkase/supabase-provider.tsx` (audit-only; no changes expected)

## Changes

### 1. Queue version bump (offline-queue.ts)

- `QUEUE_KEY`: `v1` → `v2` so stale pre-fix writes are dropped on next load.

### 2. Harden progress upsert (offline-queue.ts)

In `runOne()`:

- Before each `upsert`, assert `userId`, `bookId`, and (for progress) `status` are non-empty; throw a descriptive `Error` if missing instead of letting Supabase return an opaque conflict error.
- Wrap dev logs: `if (import.meta.env.DEV) console.debug("[bookkase] upsert user_books", { userId, bookId, status, progressType, progressValue })`.
- On Supabase error, rethrow with `new Error(\`user_books upsert failed: ${error.message} (code=${error.code}, details=${error.details}))`— same treatment for`reading_journey`.
- Keep `onConflict: "user_id,book_id"` for `user_books` (matches schema unique constraint) and `onConflict: "id"` for `reading_journey`.

### 3. Reading journey compatibility (offline-queue.ts)

Audit confirms current writes already use the compatibility fields: `entry_type`, `source`, `progress_type`, `progress_value`, `note`. No legacy `moment_type`/`body` references exist. Keep entry_type mapping:

- progress writes → `"progress"` (or `"finished"` when `status==="finished"`, `"status"` when `status==="dnf"`)
- moment writes → `"moment"`

No code change here beyond the dev-logging additions above; documented as verified.

### 4. Status normalization (schema.ts + queries.ts)

- In `schema.ts`, add `normalizeStatus(raw: string | null | undefined): BookStatus | null` that lowercases, strips `"currently "` prefix, maps:
  - `"currently reading" | "reading"` → `"reading"`
  - `"currently listening" | "listening"` → `"listening"`
  - `"rereading" | "re-reading"` → `"rereading"`
  - `"finished" | "read"` → `"finished"`
  - `"dnf" | "did not finish"` → `"dnf"`
- Export `ACTIVE_STATUS_VALUES` containing BOTH canonical and legacy strings (`["reading","listening","rereading","Currently Reading","Currently Listening","Rereading"]`) for the `.in()` filter, so the DB returns rows regardless of which convention is stored.
- `useActiveBooks()` in `queries.ts` uses `ACTIVE_STATUS_VALUES`, then post-processes each row through `normalizeStatus` so the UI always sees canonical values.

### 5. Active book query resilience (queries.ts)

- Add dev logging on success (`count`) and on error (full `error` object).
- Return shape unchanged for components.
- Add similar dev logging to `useUpdateProgress`, `useAddMoment`, `useManualSync`.

### 6. Reading page empty/error states (`_app.reading.tsx`)

- Distinguish three states from `useActiveBooks()`:
  - `isError` → show error message (`error.message`) + "Try again" button calling `refetch()`.
  - `!isLoading && data?.length === 0` → show "No active reading sessions found." copy (no styling overhaul; reuse existing empty container).
  - otherwise → existing list.
- No new components, no design changes — just message text + a retry button using existing `bk-pill` class.

### 7. Supabase + Clerk flow audit (supabase-provider.tsx)

Verified: `accessToken` callback always calls `getToken({ template: CLERK_SUPABASE_TEMPLATE })` where `CLERK_SUPABASE_TEMPLATE === "supabase"`. All hooks (`useActiveBooks`, `useJourney`, mutations) go through `useSupabase()`, so no anonymous requests are issued. No code change; documented as verified.

## Validation

After implementation I will:

- Re-read each edited file to confirm syntax.
- Confirm `routeTree.gen.ts` does not need regeneration (no new routes).
- Spot-check `_app.reading.tsx` continues to compile against the updated `useActiveBooks()` return type.

## Remaining risks (to report after build)

- Legacy rows with unusual status strings outside the normalization map will still be filtered out — surfaced via dev log.
- Queue v2 silently drops v1 entries; any unsynced pre-fix writes on a user's device are lost (intentional per task 1).
- `reading_journey` schema assumes the compatibility columns exist on the live DB; if a column is missing the new error wrapper will surface it clearly instead of failing silently.

## Recommended next improvements (not in this pass)

- Add a Supabase view or RPC for "active books" so the client doesn't need to know about legacy status strings.
- Add exponential backoff + max-attempts cap to `flushQueue` instead of retrying every item forever.
- Persist last sync timestamp + last error per item for the Profile diagnostics panel.

&nbsp;