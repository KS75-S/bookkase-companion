# Capture while reading — push Moods / Tags / Tropes / Content Warnings to BookKase

Add a light "Add to this book" panel on the Reading screen so a user can attach emotional metadata to the book they're reading, and push it to BookKase's merge endpoint with the Clerk-issued Supabase access token the app already uses.

## What the user sees

On each book card under Reading, a third action: **Add to book**. Tapping it opens a sheet (same pattern as Capture Moment / Update Progress) with four chip inputs:

- Moods
- Tags
- Tropes
- Content Warnings (subdued styling)

Each row: type a value, press Enter or comma to turn it into a chip, tap the x to remove it before saving. A short suggestion list of common values sits under each row for one-tap adding. Values are trimmed; duplicates within the row are dropped locally, the server handles the rest.

**Save** sends one request. On success: a "Saved to library ✓" toast and the sheet closes. Removal of existing BookKase values is not part of this feature.

Error states:
- Session expired (401) — inline message "Your session expired — sign in again" with a Sign in action.
- Book no longer available (403/404) — message saying the book is no longer in the BookKase library; no retry.
- Rate limited (429) — "Too many saves, try again in Ns" using the Retry-After header; save stays in the sheet.
- Offline / network failure — toast "Saved offline — will sync when you're back", the pending values are stored locally (one pending item per book) and retried on next app open and when the browser reports it's back online.
- Bad request (400) — generic "Couldn't save" plus a console error; not retried.

## Technical details

**Config** — new `BOOKKASE_BASE_URL` resolution in `src/lib/bookkase/config.ts`: reads `import.meta.env.VITE_BOOKKASE_BASE_URL`, with a localStorage override (`bookkase:base-url`) surfaced as a field on the Profile page so it can be changed without a rebuild. No hardcoded host in the call site.

**Client** — new `src/lib/bookkase/book-metadata.ts`:
- `patchBookMetadata({ baseUrl, token, bookId, moods, tags, tropes, contentWarnings })` → `PATCH {baseUrl}/api/companion/book-metadata` with `Authorization: Bearer <token>`, JSON body containing `bookId` plus only the non-empty fields as string arrays.
- Returns a discriminated result: `{ ok: true, merged }` or `{ ok: false, kind: "unauthorized" | "badRequest" | "notFound" | "rateLimited" | "network" | "unknown", retryAfterSeconds? }` so the UI maps status codes to the messages above without throwing.
- Token comes from Clerk `getToken({ template: "supabase" })` — the same token `SupabaseProvider` already injects into Supabase calls, so `sub` matches `reading_journey.user_id`.

**Retry queue** — reuse the existing `idb-keyval` pattern from `offline-queue.ts` with a separate key (`bookkase:companion:pending-metadata:v1`) keyed by `bookId`; a new pending save for the same book merges into the existing entry. A flush runs on app mount and on `online`, mirroring how the write queue is drained today. Terminal errors (400/403/404) drop the item instead of retrying.

**UI** — new `src/components/bookkase/AddToBookSheet.tsx` using the existing Sheet + `bk-pill` chip styling already used in `AddMomentSheet`; wired from a new button in `BookCard.tsx`. A small reusable `ChipInput` lives inside that file rather than a new component library.

No changes to the `reading_journey` write path, schema, RLS, or the Supabase queries.

## Open risk

The PATCH is cross-origin (companion host → BookKase host), so BookKase must return CORS headers allowing `PATCH` and the `Authorization` header from this origin. If it doesn't, the browser blocks the request and it surfaces as a network error (and queues). Worth confirming on the BookKase side; if CORS can't be opened, the call would need to be proxied through a server function here instead.
