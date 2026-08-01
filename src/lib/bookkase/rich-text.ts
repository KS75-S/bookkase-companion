/**
 * Tiny allowlist sanitizer for the review rich-text field.
 *
 * We store a very small HTML subset in the existing `note` text column:
 *   b / strong / i / em / u / br / p / ul / ol / li
 *   span[data-spoiler="true"]  → rendered blurred until tapped
 *
 * Everything else (scripts, styles, event handlers, urls, attributes) is
 * dropped. Sanitizing is string-based so it also runs during SSR.
 */

const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "br",
  "p",
  "div",
  "ul",
  "ol",
  "li",
  "span",
]);

const VOID_TAGS = new Set(["br"]);

export const SPOILER_ATTR = "data-spoiler";

/** Strip everything outside the allowlist and remove all attributes but data-spoiler. */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  // Remove script/style blocks entirely (including their content).
  let html = input.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  // Drop comments.
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  const openStack: string[] = [];

  html = html.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (_m, rawName: string, rawAttrs: string) => {
    const name = rawName.toLowerCase();
    const isClose = _m.startsWith("</");
    if (!ALLOWED_TAGS.has(name)) return "";

    if (isClose) {
      const idx = openStack.lastIndexOf(name);
      if (idx === -1) return "";
      openStack.splice(idx, 1);
      return `</${name}>`;
    }

    if (VOID_TAGS.has(name)) return `<${name} />`;

    let attrs = "";
    if (name === "span" && /data-spoiler\s*=\s*["']?true["']?/i.test(rawAttrs)) {
      attrs = ` ${SPOILER_ATTR}="true"`;
    }
    openStack.push(name);
    return `<${name}${attrs}>`;
  });

  // Close anything left dangling.
  for (let i = openStack.length - 1; i >= 0; i--) {
    html += `</${openStack[i]}>`;
  }
  return html.trim();
}

/** True when the value contains no visible text (only markup / whitespace). */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
}

/** Plain-text preview for cases where markup isn't wanted. */
export function richTextToPlain(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}
