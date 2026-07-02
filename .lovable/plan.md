## Goal
Fix missing book covers by mapping BookKase's real `books.cover` (text) column into the app's `book.cover_url`, and handle Supabase Storage `covers/` bucket paths.

## Changes

### 1. `src/lib/bookkase/schema.ts`
Add a `BOOK_COLUMNS` constant listing the columns to select from `books`:
```ts
export const BOOK_COLUMNS = "id,title,author,cover,total_pages,total_chapters,total_duration_seconds";
export const COVERS_BUCKET = "covers";
```

### 2. `src/lib/bookkase/types.ts`
Change the `Book` interface field from `cover_url` to `cover` (matches real column). Keep the rest as-is.

### 3. New helper `src/lib/bookkase/covers.ts`
Export `resolveCoverUrl(supabase, cover: string | null): string | null`:
- `null` / empty → `null`
- Starts with `http://` or `https://` (external provider URL) → return as-is
- Otherwise treat as a Storage object path in the `covers` bucket → return `supabase.storage.from("covers").getPublicUrl(path).data.publicUrl`
- Strip a leading `covers/` prefix if present so both `foo.jpg` and `covers/foo.jpg` work

### 4. `src/lib/bookkase/queries.ts`
Replace the wildcard nested select `book:books(*)` with an explicit projection using `BOOK_COLUMNS` in `useActiveBooks`, `useLibraryBooks`, and `useJourney` (anywhere `books(*)` appears). This ensures the `cover` column is fetched and avoids relying on the legacy `cover_url` name.

### 5. Consumers
Update the two render sites to resolve the URL through the helper:
- `src/components/bookkase/BookCard.tsx` — replace `book.cover_url` with `resolveCoverUrl(supabase, book?.cover)` (memoized via `useMemo`, using `useSupabase()`).
- `src/components/bookkase/ChooseFromLibrarySheet.tsx` — same swap for the thumbnail.
- `src/components/bookkase/JourneyEntry.tsx` — if a cover thumbnail is rendered there, apply the same swap; otherwise leave alone.

Also update `useAddManualBook` in `queries.ts`: if it currently writes to `cover_url`, rename that field to `cover` (keeping the existing "drop columns on missing" fallback intact).

### 6. Alt text
Set `alt={book?.title ? \`Cover of ${book.title}\` : "Book cover"}` on the `<img>` tags (previously `alt=""`) — small SEO/a11y win while we're touching these files.

## Out of scope
- No new upload UI, no bucket creation, no RLS changes. The `covers` bucket is assumed to exist and be publicly readable in the user's BookKase project (that's how the main web app serves them).
- No changes to Journey moment/status logic.

## Verification
- Build passes.
- On the Reading tab, cards with a `books.cover` value show the image; cards without still show the `BookOpen` fallback.
- External URLs (Open Library / Google Books) and Storage-relative paths both render.
