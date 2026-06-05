/**
 * BookKase wordmark — official light/dark variants served from CDN.
 * Switches via the app's `dark` class (not OS prefers-color-scheme).
 */
import lightWordmark from "@/assets/bookkase-wordmark-light.png.asset.json";
import darkWordmark from "@/assets/bookkase-wordmark-dark.png.asset.json";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block ${className}`}>
      <img
        src={lightWordmark.url}
        alt="BookKase wordmark"
        className="block h-10 w-auto select-none dark:hidden"
        draggable={false}
      />
      <img
        src={darkWordmark.url}
        alt="BookKase wordmark"
        className="hidden h-10 w-auto select-none dark:block"
        draggable={false}
      />
    </span>
  );
}
