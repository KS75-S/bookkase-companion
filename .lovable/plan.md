## Problem

The Reading tab (and Library, Journey, Plan) fail with:

```
invalid input syntax for type uuid: "user_3EYm3OqLemQQM11q1drAotndguw"
```

BookKase's `user_books.user_id`, `reading_journey.user_id`, and `reading_plan.user_id` are `uuid` columns. RLS matches them against `auth.uid()`, which — via your Clerk JWT template (`sub = user.external_id`) — resolves to the Supabase uuid.

The Companion, however, is filtering and inserting with `useUser().user.id` from Clerk, which is the Clerk-native id (`user_...`), not the uuid. Postgres rejects it before RLS is even consulted.

## Fix

Read the Supabase uuid from Clerk's `user.externalId` and use it everywhere the app currently uses `user.id`.

### 1. Central helper

Add `src/lib/bookkase/use-supabase-user-id.ts`:

- Wraps `useUser()` and returns `{ userId: string | null, isSignedIn, isLoaded }`.
- `userId` is `user.externalId ?? null`.
- If signed-in but `externalId` is missing, log a dev-mode warning ("Clerk user has no externalId — check JWT template / user provisioning") and return `null` so queries stay disabled instead of firing bad requests.

### 2. Swap call sites

Replace every `const { user } = useUser()` + `user.id` in these files with the helper's `userId`:

- `src/lib/bookkase/queries.ts` — every hook: `useActiveBooks`, `useLibraryBooks`, `useSetCurrentlyReading`, `useAddManualBook`, `useJourney`, `useUpdateProgress`, `useAddMoment`, `useDeleteJourneyEntry`, `useUpdateJourneyEntry`, `useReadingPlan`, `useSetCurrentlyReadingByBookId`.
  - Query `enabled` becomes `!!userId`.
  - Query keys use `userId` (so cache re-keys correctly).
  - `.eq("user_id", userId)` and insert payloads (`user_id: userId`) use the uuid.
- `src/lib/bookkase/offline-queue.ts` — the enqueued `userId` field is already whatever the mutation passes in, so once the mutations pass `userId` (the uuid) it flows through unchanged. Verify the two upsert paths (progress, moment) still send `user_id: item.userId`.

No schema, RLS, or JWT-template changes — those are already correct on the BookKase side.

### 3. Empty-state guard on Reading

`src/routes/_app.reading.tsx` currently shows the generic "We couldn't reach your library" card on any error. Once queries stop 400-ing, this will resolve on its own; no code change needed there. If `externalId` is somehow null for a valid Clerk user, the query is disabled and the page renders the normal empty state instead of an error.

## Verification

1. Reload `/reading` while signed in — no `22P02` errors in the console, active books render (or the real empty state if none).
2. Journey tab loads without error.
3. "Choose from Plan" and "Choose from Library" sheets populate.
4. Capture a moment / update progress — row appears in `reading_journey` with `user_id` matching `auth.uid()`.

## Out of scope

- Any Supabase migrations, RLS edits, or Clerk JWT-template changes.
- Refactoring the offline queue schema (bump not needed — `userId` field semantics change from Clerk id to uuid, but nothing in-flight is expected on a broken build).
