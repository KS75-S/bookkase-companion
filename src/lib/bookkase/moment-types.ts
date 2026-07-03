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

export function isMomentType(v: unknown): v is MomentType {
  return typeof v === "string" && MOMENT_TYPES.some((t) => t.id === v);
}

export function momentTypeLabel(v: string | null | undefined): string | null {
  const t = MOMENT_TYPES.find((x) => x.id === v);
  return t ? t.label : null;
}
