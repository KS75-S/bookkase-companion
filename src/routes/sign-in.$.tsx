import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

import { Wordmark } from "@/components/bookkase/Wordmark";

export const Route = createFileRoute("/sign-in/$")({
  head: () => ({
    meta: [
      { title: "Sign in — BookKase Companion" },
      { name: "description", content: "Sign in to continue your reading journey." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="text-center">
        <Wordmark className="!text-[1.8rem]" />
        <p className="mt-3 bk-accent text-base text-muted-foreground">
          your reading journal, in your pocket
        </p>
      </div>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-in"
        forceRedirectUrl="/reading"
        appearance={{
          variables: {
            colorPrimary: "oklch(0.48 0.12 270)",
            fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif",
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  );
}
