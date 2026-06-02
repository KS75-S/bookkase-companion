/**
 * Publishable / anon keys — safe to ship to the browser.
 * The Clerk Publishable Key and Supabase anon key are both client-side by design.
 */

export const CLERK_PUBLISHABLE_KEY =
  "pk_test_dmFsdWVkLWhvcnNlLTQyLmNsZXJrLmFjY291bnRzLmRldiQ";

export const SUPABASE_URL = "https://dyptjrvaixoknyrcksfw.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cHRqcnZhaXhva255cmNrc2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzgxODIsImV4cCI6MjA5NDExNDE4Mn0.0R3K3koNbPpAmiqmaJjDrjUh9lt7_M8nCB_7yt5JLyI";

/** Clerk JWT template name configured in the Clerk dashboard for Supabase. */
export const CLERK_SUPABASE_TEMPLATE = "supabase";
