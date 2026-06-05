/**
 * BookKase wordmark — official light/dark variants served from CDN.
 */
import lightWordmark from "@/assets/bookkase-wordmark-light.png.asset.json";
import darkWordmark from "@/assets/bookkase-wordmark-dark.png.asset.json";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <picture className={`inline-block ${className}`}>
      <source srcSet={darkWordmark.url} media="(prefers-color-scheme: dark)" />
      <img
        src={lightWordmark.url}
        alt="BookKase wordmark"
        className="h-10 w-auto select-none dark:hidden"
        draggable={false}
      />
      <img
        src={darkWordmark.url}
        alt="BookKase wordmark"
        className="hidden h-10 w-auto select-none dark:block"
        draggable={false}
      />
    </picture>
  );
}
