import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";

import { useSupabase } from "./supabase-provider";
import {
  ACTIVE_STATUS_VALUES,
  BOOK_COLUMNS,
  TABLES,
  normalizeStatus,
  type BookStatus,
  type ProgressType,
} from "./schema";

import type { JourneyEntry, ReadingPlanEntry, UserBook } from "./types";
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
        .select(`*, book:${TABLES.books}(${BOOK_COLUMNS})`)
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

export function useLibraryBooks() {
  const supabase = useSupabase();
  const { user, isSignedIn } = useUser();
  return useQuery<UserBook[]>({
    enabled: !!isSignedIn && !!user,
    queryKey: ["bookkase", "library-books", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from(TABLES.userBooks)
        .select(`*, book:${TABLES.books}(${BOOK_COLUMNS})`)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) {
        if (DEV) console.error("[bookkase] library load failed", error);
        throw error;
      }
      const rows = (data ?? []) as unknown as UserBook[];
      const normalized = rows.map((r) => {
        const n = normalizeStatus(r.status as unknown as string);
        return n ? ({ ...r, status: n } as UserBook) : r;
      });
      devLog("library loaded", { count: normalized.length });
      return normalized;
    },
  });
}

export interface SetCurrentlyReadingInput {
  ub: UserBook;
}

/**
 * Mark an existing user_book as currently reading (or listening, if audio).
 * Preserves existing progress_type/progress_value when present.
 */
export function useSetCurrentlyReading() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async ({ ub }: SetCurrentlyReadingInput) => {
      if (!user) throw new Error("Not signed in");
      const isAudio =
        ub.progress_type === "timestamp" ||
        !!ub.book?.total_duration_seconds;
      const nextStatus: BookStatus = isAudio ? "listening" : "reading";
      devLog("set currently reading", { bookId: ub.book_id, nextStatus });
      const { error } = await supabase
        .from(TABLES.userBooks)
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ub.id)
        .eq("user_id", user.id);
      if (error) {
        if (DEV) console.error("[bookkase] set currently reading failed", error);
        throw error;
      }
      return { id: ub.id, status: nextStatus };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookkase", "active-books"] });
      qc.invalidateQueries({ queryKey: ["bookkase", "library-books"] });
    },
  });
}

export interface AddManualBookInput {
  title: string;
  author: string;
  totalPages?: number | null;
  totalDurationSeconds?: number | null;
  isbn?: string | null;
  asin?: string | null;
  goodreadsId?: string | null;
  setCurrentlyReading?: boolean;
}

/**
 * Manually add a book to the user's library. Inserts a `books` row and
 * a corresponding `user_books` row. If the optional identifier columns
 * (isbn / asin / goodreads_id) don't exist on the books table, retries
 * the insert without them.
 */
export function useAddManualBook() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: AddManualBookInput) => {
      if (!user) throw new Error("Not signed in");
      const title = input.title.trim();
      const author = input.author.trim();
      if (!title) throw new Error("Title is required");
      if (!author) throw new Error("Author is required");

      const isAudio = !!input.totalDurationSeconds && !input.totalPages;
      const baseBook: Record<string, unknown> = {
        title,
        author,
        pages: input.totalPages ?? null,
      };
      const idFields: Record<string, unknown> = {};
      if (input.isbn) idFields.isbn = input.isbn.trim();
      if (input.asin) idFields.asin = input.asin.trim();
      if (input.goodreadsId) idFields.goodreads_id = input.goodreadsId.trim();

      devLog("manual add book", { title, author, ...idFields });

      let bookRow: { id: string } | null = null;
      let lastErr: unknown = null;

      // Try insert with identifier columns first, then progressively drop
      // any column that the schema doesn't have.
      const attempts: Array<Record<string, unknown>> = [
        { ...baseBook, ...idFields },
        baseBook,
      ];
      for (const payload of attempts) {
        const { data, error } = await supabase
          .from(TABLES.books)
          .insert(payload)
          .select("id")
          .single();
        if (!error && data) {
          bookRow = data as { id: string };
          break;
        }
        lastErr = error;
        const msg = (error?.message ?? "").toLowerCase();
        // Retry only when error is about a missing column
        if (!/column .* does not exist|could not find .* column|schema cache/.test(msg)) {
          break;
        }
      }
      if (!bookRow) {
        if (DEV) console.error("[bookkase] manual add book insert failed", lastErr);
        throw lastErr instanceof Error ? lastErr : new Error("Failed to add book");
      }

      const status: BookStatus = input.setCurrentlyReading
        ? isAudio
          ? "listening"
          : "reading"
        : "reading";

      const ubPayload: Record<string, unknown> = {
        user_id: user.id,
        book_id: bookRow.id,
        status: input.setCurrentlyReading ? status : "reading",
        updated_at: new Date().toISOString(),
      };
      // If user didn't ask to set as currently reading, we still need a status
      // value. Default to "reading" so it appears as active — matches the
      // companion-app flow where you only add a book you're about to read.
      const { error: ubError } = await supabase
        .from(TABLES.userBooks)
        .insert(ubPayload);
      if (ubError) {
        if (DEV) console.error("[bookkase] manual add user_book failed", ubError);
        throw ubError;
      }
      return { bookId: bookRow.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookkase", "active-books"] });
      qc.invalidateQueries({ queryKey: ["bookkase", "library-books"] });
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
        .select(`*, book:${TABLES.books}(${BOOK_COLUMNS})`)
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
  tags?: string[];
  progressType?: ProgressType | null;
  progressValue?: string | null;
  momentType?: string | null;
  spoiler?: boolean;
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
        tags: input.tags ?? [],
        momentType: input.momentType ?? null,
        spoiler: !!input.spoiler,
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



export function useDeleteJourneyEntry() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!user) throw new Error("Not signed in");
      devLog("delete journey entry", { entryId });
      const { error } = await supabase
        .from(TABLES.journey)
        .delete()
        .eq("id", entryId)
        .eq("user_id", user.id);
      if (error) {
        if (DEV) console.error("[bookkase] delete journey entry failed", error);
        throw error;
      }
      return { id: entryId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookkase", "journey"] });
    },
  });
}

export interface UpdateJourneyEntryInput {
  entryId: string;
  note?: string | null;
  tags?: string[] | null;
  progressType?: ProgressType | null;
  progressValue?: string | null;
}

export function useUpdateJourneyEntry() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: UpdateJourneyEntryInput) => {
      if (!user) throw new Error("Not signed in");
      devLog("update journey entry", input);
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.note !== undefined) patch.note = input.note;
      if (input.tags !== undefined) {
        patch.tags = input.tags && input.tags.length > 0 ? input.tags : null;
      }
      if (input.progressType !== undefined) patch.progress_type = input.progressType;
      if (input.progressValue !== undefined) patch.progress_value = input.progressValue;
      const { error } = await supabase
        .from(TABLES.journey)
        .update(patch)
        .eq("id", input.entryId)
        .eq("user_id", user.id);
      if (error) {
        if (DEV) console.error("[bookkase] update journey entry failed", error);
        throw error;
      }
      return { id: input.entryId };
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
