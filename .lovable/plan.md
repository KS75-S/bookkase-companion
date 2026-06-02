
# BookKase Companion (PWA)

A mobile-first installable web app that mirrors the Companion spec: continue reading, capture moments, and review the reading journey — synced live with the existing BookKase Supabase database, gated by the existing Clerk identity.

## Scope (in / out)

**In v1**
- Mobile-first PWA (installable to Android home screen, `display: standalone`, BookKase icons + theme color)
- Clerk sign-in (shared sessions with BookKase web)
- 3 tabs: Reading · Journey · Profile
- Currently Reading + Currently Listening sections, ombre progress, Update Progress sheet, Add Moment sheet
- Journey timeline (moments, progress updates, status changes, finished)
- Profile: email, streak, goal, sync status, pending writes, manual sync, sign out, light/dark toggle
- Offline writes (IndexedDB queue) with dedupe + auto-replay
- Active-book filtering only (Reading / Listening / Rereading, optional Finished last 30d)
- Light "cream/parchment" + Dark "twilight navy" themes, Libre Baskerville + Nunito + Cormorant Garamond Italic
- Service worker configured per Lovable's iframe-safe PWA rules

**Out of v1** (desktop owns these)
- Library, Collections, Series, Authors, Discovery, Metadata editing, Stats, Notebook
- Adding new books to the library

## Inputs you need to provide

1. **Clerk Publishable Key** (`pk_...`) — added via secrets tool as `VITE_CLERK_PUBLISHABLE_KEY`. Must be the same Clerk instance as BookKase web.
2. **Existing BookKase Supabase**: project URL + anon key, added as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. **Schema confirmation** for the tables Companion reads/writes — see "Data contract" below. If actual column names differ, I'll adapt before wiring.
4. **Official BookKase wordmark** (SVG preferred) so I don't recreate it.
5. **Clerk → Supabase auth bridge**: Companion writes must be attributable to the same user the desktop app sees. Confirm which of these BookKase already uses:
   - (a) Supabase RLS keyed off Clerk JWT claims via a Clerk JWT template named `supabase` (most common), or
   - (b) A `users` table that maps `clerk_user_id` → internal UUID, with RLS using that mapping.
   I'll wire whichever matches; (a) is the default I'll assume if you don't say.

## Data contract (assumed, adjust on confirmation)

Read:
- `books` — id, title, author, cover_url, total_pages, total_duration_seconds, chapters
- `user_books` (or equivalent) — user_id, book_id, status (`reading|listening|finished|dnf|rereading`), progress_type, progress_value, updated_at
- `reading_journey` — id, user_id, book_id, source, entry_type, progress_type, progress_value, note, created_at, updated_at
- `reading_stats` — streak, goal (or computed on the fly)

Write (always `source = 'companion'`):
- Insert into `reading_journey` on every progress update and every moment
- Update `user_books` status + progress on Update Progress
- Idempotency via client-generated `id` (UUID v4) so retries don't duplicate

If the real schema uses different table/column names, I rename in one place (`src/lib/bookkase/schema.ts`) — the rest of the app reads through typed helpers.

## Architecture

- **TanStack Start** SPA-style with a small set of routes — Companion is a logged-in app shell, not a content site
- **Routes**
  - `/` → redirects to `/reading` if signed in, `/sign-in` otherwise
  - `/sign-in` (Clerk `<SignIn />`)
  - `/_app/reading` — Reading tab (default)
  - `/_app/journey` — Journey timeline
  - `/_app/profile` — Profile + settings
  - `/_app` layout: persistent header (wordmark + theme toggle) + bottom nav, gates on Clerk session
- **State / data**: TanStack Query for all server data (`books`, `user_books`, `reading_journey`). `ensureQueryData` in loaders, `useSuspenseQuery` in components.
- **Supabase access**: browser client with Clerk-issued JWT attached via `accessToken` callback on `createClient`. No service-role usage; RLS does the gating.
- **Offline queue**:
  - `idb-keyval` (or Dexie) store: `pendingWrites[]` with `{ id, kind, payload, attempts, createdAt }`
  - Mutations write to queue first, then attempt network. UI shows entries as "syncing" until acked.
  - Background sync: on `online` event, on app focus, on manual sync button. Server-side dedupe via the client-generated row `id`.
- **PWA**:
  - Manifest with BookKase name, icons (192/512/maskable), `display: standalone`, theme colors per mode
  - `vite-plugin-pwa` with `devOptions.enabled: false`, iframe-guarded SW registration, `NetworkFirst` for HTML, denylist for `/~oauth`
  - Note: install + offline behavior only works on the published URL, not the Lovable editor preview

## Design system (tokens added to `src/styles.css`)

**Light (parchment)**
- bg `oklch(0.985 0.012 85)` (warm cream)
- surface `oklch(0.96 0.018 80)`
- foreground `oklch(0.22 0.025 280)`
- border `oklch(0.88 0.018 80)`

**Dark (twilight)**
- bg `oklch(0.18 0.04 270)` (deep indigo, not black)
- surface `oklch(0.235 0.045 270)`
- foreground `oklch(0.94 0.01 80)`
- border `oklch(0.32 0.04 270)`

**Accents (both modes)**
- dusty-rose `oklch(0.72 0.09 18)`
- twilight-lavender `oklch(0.62 0.11 295)`
- muted-indigo `oklch(0.48 0.12 270)`
- antique-gold `oklch(0.78 0.11 85)` (accent only, never a card surface)

**Gradients**
- `--gradient-ombre: linear-gradient(90deg, dusty-rose → twilight-lavender → muted-indigo)` — used for progress bars and primary buttons (pill, soft elevation, Nunito SemiBold, not all-caps)

**Typography** (Google Fonts via `<link>` in root head)
- `--font-display: 'Libre Baskerville', serif` — page titles, section headers, moment text
- `--font-ui: 'Nunito', sans-serif` — everything functional
- `--font-accent: 'Cormorant Garamond', serif` italic — sparing, for atmospheric quotes only

## Screen-by-screen

**Header (every `_app` route)**
- Left: BookKase wordmark asset
- Right: sun/moon theme toggle (persists in localStorage, defaults to system)

**Reading tab**
- "Currently Reading" section header (Libre Baskerville)
- List of book cards (cover left, title/author/status/progress right, ombre bar bottom, two pill buttons: Update Progress · Add Moment)
- "Currently Listening" section with same card shape but progress displays as timestamp (`hh:mm:ss`)
- Empty state ("Your story begins here") with link back to desktop for adding books

**Update Progress sheet** (bottom sheet)
- Status select: Reading / Listening / Finished / DNF / Rereading
- Progress type: Percentage / Page / Chapter / Timestamp (filtered by book medium)
- Value input (numeric / `hh:mm:ss` for timestamp)
- Optional note (textarea)
- Save → enqueues a `user_books` update + a `reading_journey` insert in a single queued unit

**Add Moment sheet**
- Prompt: "What are you thinking?"
- Textarea (Libre Baskerville, generous spacing)
- Auto-attached context: current book + current progress (editable)
- Save → enqueues `reading_journey` insert with `entry_type='moment'`

**Journey tab**
- Reverse-chronological list grouped by day
- Moments rendered as journal cards (text is hero, metadata muted)
- Progress / status entries rendered compactly below the day header
- Infinite scroll via TanStack Query `useInfiniteQuery`

**Profile tab**
- Clerk user email + avatar
- Streak, reading goal (read-only in v1, edit on desktop)
- Sync status (last synced, # pending writes), Sync now button
- Theme toggle (same as header, also lives here)
- Sign out (Clerk)

## Implementation order

1. Install Clerk + Supabase, wire env/secrets, set up `_app` layout with auth gate and bottom nav
2. Add design tokens, fonts, wordmark, light/dark toggle
3. Reading tab + book card + ombre progress + Update Progress sheet (online-only path first)
4. Add Moment sheet
5. Journey tab + moment cards + infinite scroll
6. Profile tab
7. Offline queue (IndexedDB) + sync indicators + dedupe
8. PWA manifest + iframe-safe service worker
9. Pass: copy polish, empty states, error states, accessibility

## Risks / things to flag

- **Schema drift**: if BookKase desktop uses different table/column names than the assumed ones, I'll need a 10-minute schema confirmation before step 3.
- **Clerk ↔ Supabase RLS**: if BookKase doesn't already have a Clerk JWT template configured for Supabase, that needs to be set up in the Clerk dashboard before Companion writes will pass RLS. I can't do that from Lovable; you'll need to follow Clerk's "Connect Clerk to Supabase" guide once.
- **PWA preview**: install/offline only work on the published `*.lovable.app` URL, not inside the Lovable editor iframe — this is expected.
- **No native shell**: this is a PWA, not a Play Store APK. If you later need Play Store distribution, the same codebase can be wrapped with Bubblewrap/TWA, but that step happens outside Lovable.
