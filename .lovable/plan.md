# Why the library won't load

## What the evidence shows

Every failing request is the same shape, e.g.:

```text
GET /rest/v1/user_books?...&user_id=eq.37a6ca13-7af4-4c5c-b73f-0b92bbfa0ff7
400  {"code":"22P02","message":"invalid input syntax for type uuid: \"user_3DbIbrN4Wt1bbbeqL4A9a4HOqoM\""}
```

Two facts, both confirmed from the captured traffic:

1. The companion is sending the **correct** value. The filter is `user_id=eq.37a6ca13-…`, the Supabase uuid, taken from Clerk `externalId` via `useSupabaseUserId`. The Clerk id never appears in the query string.
2. The rejected value, `user_3DbIbrN4Wt1bbbeqL4A9a4HOqoM`, is the **`sub` claim of the Clerk-issued Supabase JWT**. Decoding the token returned by `/tokens/supabase` shows:
   - `"sub": "user_3DbIbrN4Wt1bbbeqL4A9a4HOqoM"`
   - `"external_id": "37a6ca13-7af4-4c5c-b73f-0b92bbfa0ff7"`

So Postgres is not choking on our filter — it is choking on `auth.uid()` inside the row-level security policy on `user_books` (and `reading_plan`, which fails identically). `auth.uid()` returns `sub` cast to `uuid`; `sub` is the Clerk `user_...` string, which is not a uuid, so the policy errors out with `22P02` before any row is evaluated.

The code comment in `use-supabase-user-id.ts` assumes the JWT template maps `sub` to `user.external_id`. It currently does not — it maps `external_id` to a separate claim and leaves `sub` as the Clerk id. That mismatch is the whole bug.

Nothing in this companion app can fix it: the app is already sending the only correct value it has.

## The fix (one of two, both outside this repo)

**Option A — change the Clerk JWT template (preferred, one edit).**
In the Clerk dashboard, the `supabase` JWT template's `sub` claim becomes `{{user.external_id}}`. Then `auth.uid()` returns the uuid, existing policies work unchanged, and both BookKase web and the companion benefit. Requires every Clerk user to have `external_id` populated (this account does).

**Option B — change the RLS policies on the BookKase Supabase project.**
Replace `auth.uid()` in the policies for `user_books`, `reading_plan`, `reading_journal_entries`, `books`, and any other companion-touched table with:

```sql
(auth.jwt() ->> 'external_id')::uuid
```

More edits, and every future table has to remember the same idiom, but it avoids touching the token shape that BookKase web may already rely on.

## Verification after the fix

Reload Reading and confirm the same request returns `200` with rows instead of `400 / 22P02`, and that the console `[bookkase] active books load failed` entries stop.

## What this plan does not change

No companion source changes are proposed. If you want a defensive touch afterwards, the one worth adding is a clearer error message on the Reading screen when the response code is `22P02` ("your library sign-in isn't linked yet") instead of the generic "We couldn't reach your library" — say the word and I'll add it.
