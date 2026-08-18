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

/**
 * Base URL of the deployed BookKase web app (where the companion metadata
 * endpoint lives). Configured at build time via VITE_BOOKKASE_BASE_URL, and
 * overridable at runtime from the Profile screen (stored in localStorage).
 */
const BASE_URL_STORAGE_KEY = "bookkase:base-url";

/** Stable production host — deploy-specific hashed URLs must not be used. */
const BOOKKASE_STABLE_HOST = "https://bookkase.vercel.app";

export const BOOKKASE_BASE_URL_DEFAULT =
  (import.meta.env.VITE_BOOKKASE_BASE_URL as string | undefined)?.trim() ||
  BOOKKASE_STABLE_HOST;

function normalizeBaseUrl(value: string): string {
  return value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/companion\/book-metadata$/, "")
    .replace(/\/+$/, "");
}

/**
 * Deploy-specific Vercel URLs drift between builds; ignore any vercel.app
 * override that isn't the stable production alias.
 */
function isStaleOverride(value: string): boolean {
  return /\.vercel\.app$/i.test(value) && value.toLowerCase() !== BOOKKASE_STABLE_HOST;
}

export function getBookKaseBaseUrl(): string {
  if (typeof window !== "undefined") {
    const override = window.localStorage.getItem(BASE_URL_STORAGE_KEY);
    if (override && override.trim()) {
      const v = normalizeBaseUrl(override);
      if (v && !isStaleOverride(v)) return v;
    }
  }
  return normalizeBaseUrl(BOOKKASE_BASE_URL_DEFAULT);
}

export function setBookKaseBaseUrl(value: string) {
  if (typeof window === "undefined") return;
  const v = normalizeBaseUrl(value);
  if (v) window.localStorage.setItem(BASE_URL_STORAGE_KEY, v);
  else window.localStorage.removeItem(BASE_URL_STORAGE_KEY);
}

