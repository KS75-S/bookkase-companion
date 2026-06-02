import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  CLERK_SUPABASE_TEMPLATE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "./config";

const SupabaseContext = createContext<SupabaseClient | null>(null);

/**
 * Provides a Supabase client whose `accessToken` callback returns the
 * current Clerk session JWT (issued from the `supabase` template).
 * Mount inside <ClerkProvider /> in the app tree.
 */
export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth();

  const client = useMemo(() => {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // We are NOT using Supabase Auth — Clerk owns identity.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      // Supabase JS v2.45+: callback re-runs per request so token stays fresh.
      accessToken: async () => {
        if (!isLoaded) return null;
        try {
          return await getToken({ template: CLERK_SUPABASE_TEMPLATE });
        } catch (err) {
          console.warn("[bookkase] failed to fetch Clerk token", err);
          return null;
        }
      },
    });
  }, [getToken, isLoaded]);

  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase must be used inside <SupabaseProvider />");
  }
  return client;
}
