# Diagnose the 0-day reading streak

## What I verified just now

- `GET https://bookkase.vercel.app/api/companion/reading-streak` is now live (it used to 404). Without a token it returns `401 {"error":"Missing bearer token"}`.
- CORS is correct: preflight returns 204 with `access-control-allow-origin: *` and `authorization` allowed, so the companion can call it from the browser.

So the endpoint is reachable. What I cannot tell from outside is whether your signed-in request returns a real `currentStreak: 0` or fails with 401/500 — because the streak card currently swallows every failure and keeps showing `0d`.

## Why "0d" is ambiguous today

In the streak card:

- It asks Clerk for a plain session token, and falls back to the `supabase` JWT-template token. If the web app expects the plain Clerk session token, the template token would be rejected with 401.
- On 401, network error, or 5xx, the code deliberately does nothing and leaves the previous value — which on first load is `0`.
- Result: a genuine 12-day streak that fails auth looks identical to a real zero.

## Plan

1. Make failures visible instead of silently rendering `0d`:
   - Track the last result state (loading / ok / unauthorized / offline / error) in the card.
   - Show a short muted line for each failure ("Couldn't load your streak — tap to retry") with a tap-to-retry, instead of a fake zero.
   - Keep the current "0d — reading streak starts with your next update" copy only for a confirmed `ok` response with `currentStreak: 0`.
2. Stop the token guesswork: try the plain Clerk session token, and only fall back to the `supabase` template token if the first call returns 401 (retry once), so a template mismatch cannot silently zero the streak.
3. Add a dev-only console log of the response status and parsed payload so we can see, on your device, whether the server says 0 or rejects the call.
4. Retest signed-in on the preview and report which of the two it is:
   - Real `currentStreak: 0` from the server → the streak definition lives in the BookKase web app; the fix belongs there (which activity rows count, timezone/day-boundary handling), and I'll write up exactly what the payload returned.
   - 401 → the companion's token audience doesn't match what the endpoint verifies; fix is on the token side and I'll confirm which token works.

## Technical notes

Files touched: `src/components/bookkase/StreakPill.tsx` (state machine + retry + dev logging) and `src/lib/bookkase/reading-streak.ts` (surface status/body in dev). No schema, no data changes, no changes to the BookKase web app from here.
