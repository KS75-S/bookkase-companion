import { useUser } from "@clerk/clerk-react";

const DEV = import.meta.env.DEV;
let warned = false;

/**
 * Returns the Supabase uuid for the currently signed-in Clerk user.
 *
 * BookKase's Clerk JWT template sets `sub = user.external_id`, so on Supabase
 * `auth.uid()` resolves to that uuid — which is also mirrored on the Clerk
 * user as `externalId`. Use this everywhere the app previously reached for
 * `useUser().user.id` (the Clerk-native `user_...` string), or Postgres will
 * reject the value against `uuid`-typed columns.
 */
export function useSupabaseUserId(): {
  userId: string | null;
  isSignedIn: boolean;
  isLoaded: boolean;
} {
  const { user, isSignedIn, isLoaded } = useUser();
  const externalId = user?.externalId ?? null;
  if (DEV && isSignedIn && user && !externalId && !warned) {
    warned = true;
    console.warn(
      "[bookkase] Clerk user has no externalId — check that the Supabase JWT template maps sub to user.external_id and that this user was provisioned with one."
    );
  }
  return { userId: externalId, isSignedIn: !!isSignedIn, isLoaded: !!isLoaded };
}
