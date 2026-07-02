import type { SupabaseClient } from "@supabase/supabase-js";
import { COVERS_BUCKET } from "./schema";

/**
 * Resolve a `books.cover` value into a renderable URL.
 * - null/empty -> null
 * - http(s) URL -> return as-is (external provider like Open Library / Google Books)
 * - anything else -> treat as an object path in the `covers` Storage bucket
 */
export function resolveCoverUrl(
  supabase: SupabaseClient,
  cover: string | null | undefined,
): string | null {
  if (!cover) return null;
  const trimmed = cover.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.replace(/^covers\//, "");
  const { data } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
