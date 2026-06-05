import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";

import { useSupabase } from "./supabase-provider";
import {
  ACTIVE_STATUS_VALUES,
  TABLES,
  normalizeStatus,
  type BookStatus,
  type ProgressType,
} from "./schema";
import type { JourneyEntry, UserBook } from "./types";
import { enqueueWrite, flushQueue } from "./offline-queue";

const DEV = import.meta.env.DEV;
function devLog(...args: unknown[]) {
  if (DEV) console.debug("[bookkase]", ...args);
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useActiveBooks() {
  const supabase = useSupabase();
  const { user, isSignedIn } = useUser();
  return useQuery<UserBook[]>({
    enabled: !!isSignedIn && !!user,
    queryKey: ["bookkase", "active-books", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from(TABLES.userBooks)
        .select(`*, book:${TABLES.books}(*)`)
        .eq("user_id", user.id)
        .in("status", ACTIVE_STATUS_VALUES)
        .order("updated_at", { ascending: false });
      if (error) {
        if (DEV) console.error("[bookkase] active books load failed", error);
        throw error;
      }
      const rows = (data ?? []) as unknown as UserBook[];
      // Normalize legacy/display status strings to canonical values for the UI.
      const normalized = rows.map((r) => {
        const n = normalizeStatus(r.status as unknown as string);
        return n ? ({ ...r, status: n } as UserBook) : r;
      });
      devLog("active books loaded", { count: normalized.length });
      return normalized;
    },
  });
}

export function useJourney(limit = 50) {
  const supabase = useSupabase();
  const { user, isSignedIn } = useUser();
  return useQuery<JourneyEntry[]>({
    enabled: !!isSignedIn && !!user,
    queryKey: ["bookkase", "journey", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from(TABLES.journey)
        .select(`*, book:${TABLES.books}(*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        if (DEV) console.error("[bookkase] journey load failed", error);
        throw error;
      }
      devLog("journey loaded", { count: data?.length ?? 0 });
      return (data ?? []) as unknown as JourneyEntry[];
    },
  });
}

export interface UpdateProgressInput {
  bookId: string;
  status: BookStatus;
  progressType: ProgressType;
  progressValue: string;
  note?: string | null;
}

export function useUpdateProgress() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: UpdateProgressInput) => {
      if (!user) throw new Error("Not signed in");
      const id = genId();
      const createdAt = new Date().toISOString();
      devLog("update progress", { id, ...input });
      await enqueueWrite({
        kind: "progress",
        id,
        userId: user.id,
        bookId: input.bookId,
        status: input.status,
        progressType: input.progressType,
        progressValue: input.progressValue,
        note: input.note ?? null,
        createdAt,
        attempts: 0,
      });
      await flushQueue(supabase);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookkase", "active-books"] });
      qc.invalidateQueries({ queryKey: ["bookkase", "journey"] });
    },
  });
}

export interface AddMomentInput {
  bookId: string;
  note: string;
  progressType?: ProgressType | null;
  progressValue?: string | null;
}

export function useAddMoment() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: AddMomentInput) => {
      if (!user) throw new Error("Not signed in");
      const id = genId();
      const createdAt = new Date().toISOString();
      devLog("add moment", { id, ...input });
      await enqueueWrite({
        kind: "moment",
        id,
        userId: user.id,
        bookId: input.bookId,
        progressType: input.progressType ?? null,
        progressValue: input.progressValue ?? null,
        note: input.note,
        createdAt,
        attempts: 0,
      });
      await flushQueue(supabase);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookkase", "journey"] });
    },
  });
}

export function useManualSync() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      devLog("manual sync triggered");
      return flushQueue(supabase);
    },
    onSuccess: (res) => {
      devLog("manual sync result", res);
      qc.invalidateQueries({ queryKey: ["bookkase"] });
    },
  });
}
