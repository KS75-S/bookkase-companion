import { useEffect, useRef } from "react";
import { Bold, Italic, List, Underline, EyeOff } from "lucide-react";

import { sanitizeRichText, SPOILER_ATTR } from "@/lib/bookkase/rich-text";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

function exec(command: string) {
  document.execCommand(command, false);
}

/**
 * Minimal contentEditable rich-text editor: bold / italic / underline /
 * bullet list, plus a "Spoiler" action that wraps the current selection in a
 * span the Journey feed renders blurred until tapped.
 */
export function RichTextEditor({ value, onChange, placeholder, className, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value in only when it diverges (avoids caret jumps).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    onChange(sanitizeRichText(el.innerHTML));
  };

  const runCommand = (fn: () => void) => {
    ref.current?.focus();
    fn();
    emit();
  };

  const toggleSpoiler = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;

    // If the selection already sits inside a spoiler, unwrap it.
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== el) {
      if (
        node instanceof HTMLElement &&
        node.getAttribute(SPOILER_ATTR) === "true"
      ) {
        const parent = node.parentNode;
        while (node.firstChild) parent?.insertBefore(node.firstChild, node);
        parent?.removeChild(node);
        emit();
        return;
      }
      node = node.parentNode;
    }

    const span = document.createElement("span");
    span.setAttribute(SPOILER_ATTR, "true");
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
    } catch {
      return;
    }
    emit();
  };

  const buttonClass =
    "grid h-8 w-8 place-items-center rounded-md border border-border/60 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground";

  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <button type="button" aria-label="Bold" className={buttonClass} onClick={() => runCommand(() => exec("bold"))}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Italic" className={buttonClass} onClick={() => runCommand(() => exec("italic"))}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Underline" className={buttonClass} onClick={() => runCommand(() => exec("underline"))}>
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Bullet list"
          className={buttonClass}
          onClick={() => runCommand(() => exec("insertUnorderedList"))}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Mark selection as spoiler"
          title="Highlight text, then tap to blur it as a spoiler"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
          onClick={toggleSpoiler}
        >
          <EyeOff className="h-4 w-4" />
          Spoiler
        </button>
      </div>
      <div
        id={id}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        className="bk-rich-editor bk-display min-h-[7rem] w-full rounded-xl border border-input bg-background px-3 py-2 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="mt-1 text-[11px] text-muted-foreground">
        Highlight a passage and tap Spoiler to blur it in your journey.
      </p>
    </div>
  );
}
