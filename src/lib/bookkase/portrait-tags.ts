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

const TAG_PREFIX = "[tags:";
const TAG_SUFFIX = "]";

/** Encode selected tag names as a leading marker on a note. */
export function encodeNoteWithTags(note: string, tagNames: string[]): string {
  const trimmed = note.trim();
  if (tagNames.length === 0) return trimmed;
  return `${TAG_PREFIX}${tagNames.join(", ")}${TAG_SUFFIX} ${trimmed}`.trim();
}

/** Parse tags out of a stored note. Returns { tags, text } — text is the note without the marker. */
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

export function tagByName(name: string): PortraitTag | undefined {
  const lower = name.toLowerCase();
  const mapped = LEGACY_NAME_TO_CURRENT[lower]?.toLowerCase() ?? lower;
  return PORTRAIT_TAGS.find((t) => t.name.toLowerCase() === mapped);
}
