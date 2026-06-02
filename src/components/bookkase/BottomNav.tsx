import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, NotebookText, UserRound } from "lucide-react";

const items = [
  { to: "/reading", label: "Reading", Icon: BookOpen },
  { to: "/journey", label: "Journey", Icon: NotebookText },
  { to: "/profile", label: "Profile", Icon: UserRound },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  const active = location.pathname;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.25rem)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
        {items.map(({ to, label, Icon }) => {
          const isActive = active === to || active.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="group flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium"
              >
                <span
                  className={`grid h-9 w-12 place-items-center rounded-full transition-all ${
                    isActive ? "bk-ombre text-white shadow-[var(--shadow-pill)]" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.25 : 2} />
                </span>
                <span className={isActive ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
