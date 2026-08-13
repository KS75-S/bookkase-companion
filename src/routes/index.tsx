import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="bk-display text-muted-foreground">BookKase</div>
      </div>
    );
  }
  if (isSignedIn) return <Navigate to="/reading" />;
  return <Navigate to="/sign-in/$" params={{ _splat: "" }} />;
}
