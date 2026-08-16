import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CLERK_PUBLISHABLE_KEY } from "../lib/bookkase/config";
import { SupabaseProvider } from "../lib/bookkase/supabase-provider";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="bk-display text-6xl text-foreground">404</h1>
        <h2 className="mt-3 bk-display text-xl text-foreground">A page lost between chapters</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page isn't part of your reading journey.
        </p>
        <div className="mt-6">
          <Link to="/reading" className="bk-pill inline-block">
            Back to your books
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="bk-display text-xl text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try again or head back to your reading.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bk-pill"
          >
            Try again
          </button>
          <a href="/reading" className="bk-pill-ghost">
            My books
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "BookKase Companion" },
      { name: "description", content: "Carry your reading journal in your pocket. Update progress, capture moments, and continue your reading journey." },
      { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#f6efe2" },
      { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#1a1a2e" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "BookKase" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "BookKase Companion" },
      { property: "og:description", content: "Carry your reading journal in your pocket. Update progress, capture moments, and continue your reading journey." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "BookKase Companion" },
      { name: "twitter:description", content: "Carry your reading journal in your pocket. Update progress, capture moments, and continue your reading journey." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/E4R4pGA8O6bfLlDbGeuIrRkuG7p1/social-images/social-1780432752042-BookKaseLightLogo-T.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/E4R4pGA8O6bfLlDbGeuIrRkuG7p1/social-images/social-1780432752042-BookKaseLightLogo-T.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/sign-in">
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster />
        </QueryClientProvider>
      </SupabaseProvider>
    </ClerkProvider>
  );
}
