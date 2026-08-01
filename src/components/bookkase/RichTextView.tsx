import { useRef } from "react";

import { sanitizeRichText, SPOILER_ATTR } from "@/lib/bookkase/rich-text";

/**
 * Renders sanitized review markup. Spans marked as spoilers render blurred
 * until the reader taps them.
 */
export function RichTextView({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const safe = sanitizeRichText(html);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement)?.closest?.(`[${SPOILER_ATTR}="true"]`);
    if (target instanceof HTMLElement) {
      target.toggleAttribute("data-revealed");
    }
  };

  if (!safe) return null;

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`bk-rich-text ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
