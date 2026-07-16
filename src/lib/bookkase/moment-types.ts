export const MOMENT_TYPES = [
  { id: "quote", label: "Quote" },
  { id: "theory", label: "Theory" },
  { id: "plot_twist", label: "Plot Twist" },
  { id: "question", label: "Question" },
  { id: "feeling", label: "Feeling" },
  { id: "other", label: "Other" },
] as const;

export type MomentType = (typeof MOMENT_TYPES)[number]["id"];

/** Sentinel value stored in the reading_journey `tags` array to mark a
 *  moment as a spoiler. Chosen so it can never collide with a real
 *  Portrait Tag id (which are lowercase kebab words). */
export const SPOILER_TAG = "__spoiler";

/** Sentinel value stored in a finished entry's `tags` array when the user
 *  chose to add a review later. Journey renders a "!" indicator for these. */
export const NEEDS_REVIEW_TAG = "__needs_review";

/** Prefixes stored in a finished entry's `tags` array to persist ratings
 *  without adding new columns. `__rating:4.25`, `__rating:crown`, `__spice:3`. */
export const RATING_PREFIX = "__rating:";
export const SPICE_PREFIX = "__spice:";

/** Personal rating: number 1–5 in 0.25 steps, or the string "crown" for 6. */
export type PersonalRating = number | "crown";

export function encodeRatingTag(r: PersonalRating): string {
  return `${RATING_PREFIX}${r === "crown" ? "crown" : r.toFixed(2)}`;
}
export function encodeSpiceTag(n: number): string {
  return `${SPICE_PREFIX}${Math.max(0, Math.min(5, Math.round(n)))}`;
}
export function parseRatingTag(tag: string): PersonalRating | null {
  if (!tag.startsWith(RATING_PREFIX)) return null;
  const rest = tag.slice(RATING_PREFIX.length);
  if (rest === "crown") return "crown";
  const n = parseFloat(rest);
  return Number.isFinite(n) ? n : null;
}
export function parseSpiceTag(tag: string): number | null {
  if (!tag.startsWith(SPICE_PREFIX)) return null;
  const n = parseInt(tag.slice(SPICE_PREFIX.length), 10);
  return Number.isFinite(n) ? n : null;
}

export function isMomentType(v: unknown): v is MomentType {
  return typeof v === "string" && MOMENT_TYPES.some((t) => t.id === v);
}

export function momentTypeLabel(v: string | null | undefined): string | null {
  const t = MOMENT_TYPES.find((x) => x.id === v);
  return t ? t.label : null;
}
