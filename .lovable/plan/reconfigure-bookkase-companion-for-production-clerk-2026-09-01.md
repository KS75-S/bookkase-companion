# Reconfigure BookKase Companion for Production Clerk

Switch the companion from the current Clerk test instance to the new Production Clerk instance, while keeping the test key available for local/preview development via an environment override.

## What the user provided
- Production Clerk publishable key: `pk_live_Y2xlcmsuYm9va2thc2UudmVyY2VsLmFwcCQ`
- Supabase JWT template name in production Clerk: `supabase`
- Production domain: `https://bookkase.lovable.app`
- Preference: keep the test key for dev/preview builds

## Plan

### 1. Update Clerk publishable key configuration
In `src/lib/bookkase/config.ts`:
- Replace the hardcoded `CLERK_PUBLISHABLE_KEY` test value with the production key as the default.
- Add an optional override: read `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` first, so dev/preview builds can inject the old test key without changing code.
- Keep `CLERK_SUPABASE_TEMPLATE = "supabase"` unchanged.

### 2. Document the environment override
Add a short comment explaining that `VITE_CLERK_PUBLISHABLE_KEY` can be set to the test key for non-production environments. This lets the Lovable preview and local `vite dev` continue signing in against the test instance.

### 3. Verify production Clerk dashboard settings (user action)
Before the published build goes live, confirm in the production Clerk dashboard:
- The **Supabase** JWT template exists and maps `sub` to the same Supabase user id/external_id used today.
- `https://bookkase.lovable.app` is in the allowed **Redirect URLs** and **Authorized Origins** lists.
- If the preview URL needs to use production auth too, add the preview URL to the same allowlists; otherwise leave preview on the test key via the env override.

### 4. Verify Supabase side
No schema changes are needed, but confirm the production Clerk JWT is accepted by Supabase:
- The Supabase project `dyptjrvaixoknyrcksfw` must still validate the `supabase` Clerk template signature.
- RLS policies that rely on `auth.uid()` or `auth.jwt() ->> 'external_id'` continue to resolve correctly with the production token claims.

### 5. Test the sign-in flow
After the config change:
- Local dev with `VITE_CLERK_PUBLISHABLE_KEY=<test-key>` should still sign in against the test instance.
- Published build (no override) should sign in against the production instance and load the library/streak as before.
- If the published sign-in fails, inspect Clerk's allowlist and JWT template first.

## Out of scope
- No changes to the Supabase provider, offline queue, or UI components.
- No changes to the BookKase base URL (`https://bookkase.vercel.app`).
