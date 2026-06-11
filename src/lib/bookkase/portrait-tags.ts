import feminineRage from "@/assets/portrait-tags/feminine-rage.png.asset.json";
import obsession from "@/assets/portrait-tags/obsession.png.asset.json";
import emotionalResonance from "@/assets/portrait-tags/emotional-resonance.png.asset.json";
import immersion from "@/assets/portrait-tags/immersion.png.asset.json";
import equality from "@/assets/portrait-tags/equality.png.asset.json";
import diverse from "@/assets/portrait-tags/diverse.png.asset.json";

export interface PortraitTag {
  id: string;
  name: string;
  icon: string;
}

export const PORTRAIT_TAGS: PortraitTag[] = [
  { id: "feminine-rage", name: "Feminine Rage", icon: feminineRage.url },
  { id: "obsession", name: "Obsession", icon: obsession.url },
  { id: "emotional-resonance", name: "Emotional Resonance", icon: emotionalResonance.url },
  { id: "immersion", name: "Immersion", icon: immersion.url },
  { id: "equality", name: "Equality", icon: equality.url },
  { id: "diverse", name: "Diverse", icon: diverse.url },
];

const TAG_PREFIX = "[tags:";
const TAG_SUFFIX = "]";

/** Encode selected tag names as a leading marker on a note. */
export function encodeNoteWithTags(note: string, tagNames: string[]): string {
  const trimmed = note.trim();
  if (tagNames.length === 0) return trimmed;
  return `${TAG_PREFIX}${tagNames.join(", ")}${TAG_SUFFIX} ${trimmed}`.trim();
}

/** Parse tags out of a stored note. Returns { tags, text } where text is the note without the marker. */
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

export function tagByName(name: string): PortraitTag | undefined {
  return PORTRAIT_TAGS.find((t) => t.name.toLowerCase() === name.toLowerCase());
}
