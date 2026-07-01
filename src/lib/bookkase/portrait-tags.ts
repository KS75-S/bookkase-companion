import {
  EMOTIONAL_LANGUAGE_IDS,
  EMOTIONAL_LANGUAGE_METADATA,
  type EmotionalLanguageId,
} from "./expansion-artifacts";

export interface PortraitTag {
  id: EmotionalLanguageId;
  name: string;
  subtitle: string;
}

export const PORTRAIT_TAGS: PortraitTag[] = EMOTIONAL_LANGUAGE_IDS.map((id) => ({
  id,
  name: EMOTIONAL_LANGUAGE_METADATA[id].name,
  subtitle: EMOTIONAL_LANGUAGE_METADATA[id].subtitle,
}));

/**
 * Legacy parser: earlier versions encoded tag names into the note body as
 * `[tags:Name, Name] note text`. Tags now live in a dedicated column, but
 * we still parse old entries so they render correctly.
 */
export function parseNoteTags(note: string | null | undefined): { tags: string[]; text: string } {
  if (!note) return { tags: [], text: "" };
  const match = note.match(/^\[tags:([^\]]+)\]\s*/);
  if (!match) return { tags: [], text: note };
  const tags = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { tags, text: note.slice(match[0].length) };
}

// Legacy tag names (from earlier versions) mapped to current canonical names.
const LEGACY_NAME_TO_CURRENT: Record<string, string> = {
  "emotional resonance": "Resonance",
  equality: "Belonging",
  diverse: "Diversity",
};

export function tagById(id: string): PortraitTag | undefined {
  return PORTRAIT_TAGS.find((t) => t.id === id);
}

export function tagByName(name: string): PortraitTag | undefined {
  const lower = name.toLowerCase();
  const mapped = LEGACY_NAME_TO_CURRENT[lower]?.toLowerCase() ?? lower;
  return PORTRAIT_TAGS.find((t) => t.name.toLowerCase() === mapped);
}

/** Resolve either an ID or a (possibly legacy) display name into a tag. */
export function resolveTag(value: string): PortraitTag | undefined {
  return tagById(value) ?? tagByName(value);
}

