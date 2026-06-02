import { Wordmark } from "./Wordmark";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur"
      style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Wordmark />
        <ThemeToggle />
      </div>
    </header>
  );
}
