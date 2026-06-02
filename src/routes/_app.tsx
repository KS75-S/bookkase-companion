import { useEffect } from "react";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";

import { AppHeader } from "@/components/bookkase/AppHeader";
import { BottomNav } from "@/components/bookkase/BottomNav";
import { useSupabase } from "@/lib/bookkase/supabase-provider";
import { flushQueue } from "@/lib/bookkase/offline-queue";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const supabase = useSupabase();
  const qc = useQueryClient();

  // Drain offline queue on mount, on regaining connectivity, and on tab focus.
  useEffect(() => {
    if (!isSignedIn) return;
    const sync = async () => {
      const res = await flushQueue(supabase);
      if (res.synced > 0) {
        qc.invalidateQueries({ queryKey: ["bookkase"] });
      }
    };
    sync();
    const onOnline = () => sync();
    const onFocus = () => sync();
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
    };
  }, [isSignedIn, supabase, qc]);

  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="bk-display text-muted-foreground">BookKase</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <main className="mx-auto w-full max-w-md px-4 py-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
