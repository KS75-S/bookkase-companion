# Fix "Couldn't save these details"

## What's actually wrong

The save never reached BookKase. The companion has no BookKase address configured — the Profile field is empty (verified: no `bookkase:base-url` value stored) and no build-time value exists in the project. The client returns a `badRequest` in that case, which the sheet renders as the generic "Couldn't save these details. Please try again."

## Fix

1. **Default the address.** Use `https://bookkase-f5rzph3m0-bookkase.vercel.app` as the built-in default base URL when neither the env value nor the Profile override is set. The Profile field still overrides it (useful for a custom domain later).

2. **Stop hiding real causes.** In the Add to Details sheet, when the failure is a missing/invalid base URL, show "BookKase address isn't set — add it on Profile" with a link to Profile, instead of the generic message. Other 400s show the generic message plus the server's reason when it sends one.

3. **Show what host was called.** Log the request URL and status to the console on failure so the next problem is diagnosable in one look.

4. **Verify.** After the change, open Reading, add a mood chip, save, and confirm the request hits the Vercel host and returns success (or, if it returns 401/CORS, report exactly which so the BookKase side can be adjusted).

## Technical details

- `src/lib/bookkase/config.ts`: `BOOKKASE_BASE_URL_DEFAULT` falls back to the Vercel host when `VITE_BOOKKASE_BASE_URL` is unset; base path stays the host only (the `/api/companion/book-metadata` suffix is appended by the client, so pasting the full endpoint into Profile is also tolerated by stripping a trailing `/api/companion/book-metadata`).
- `src/lib/bookkase/book-metadata.ts`: distinguish a "not configured" result from a server 400 (new `kind: "notConfigured"`), keep it terminal for the offline queue, and log method/URL/status on failure.
- `src/components/bookkase/AddToBookSheet.tsx`: map `notConfigured` to the Profile-link message.

No schema, RLS, or `reading_journey` changes.

## Known risk

The PATCH is cross-origin to the Vercel host. If BookKase doesn't send CORS headers allowing `PATCH` and `Authorization` from this origin, the browser blocks it and it surfaces as a network error (queued offline). If that happens, the follow-up is to proxy the call through a server function in this app.
