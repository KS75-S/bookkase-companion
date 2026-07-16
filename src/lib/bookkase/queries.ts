import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSupabase } from "./supabase-provider";
import { useSupabaseUserId } from "./use-supabase-user-id";
import {
  ACTIVE_STATUS_VALUES,
  BOOK_COLUMNS,
  TABLES,
  normalizeStatus,
  type BookStatus,
  type ProgressType,
} from "./schema";
import {
  NEEDS_REVIEW_TAG,
  RATING_PREFIX,
  SPICE_PREFIX,
  encodeRatingTag,
  encodeSpiceTag,
  type PersonalRating,
} from "./moment-types";

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
  const { userId, isSignedIn } = useSupabaseUserId();
  return useQuery<UserBook[]>({
    enabled: !!isSignedIn && !!userId,
    queryKey: ["bookkase", "active-books", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from(TABLES.userBooks)
        .select(`*, book:${TABLES.books}(${BOOK_COLUMNS})`)
        .eq("user_id", userId)
        .in("status", ACTIVE_STATUS_VALUES)
        .order("updated_at", { ascending: false });
      if (error) {
        if (DEV) console.error("[bookkase] active books load failed", error);
        throw error;
      }
      const rows = (data ?? []) as unknown as UserBook[];
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
  const { userId, isSignedIn } = useSupabaseUserId();
  return useQuery<UserBook[]>({
    enabled: !!isSignedIn && !!userId,
    queryKey: ["bookkase", "library-books", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from(TABLES.userBooks)
        .select(`*, book:${TABLES.books}(${BOOK_COLUMNS})`)
        .eq("user_id", userId)
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

export function useSetCurrentlyReading() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { userId } = useSupabaseUserId();
  return useMutation({
    mutationFn: async ({ ub }: SetCurrentlyReadingInput) => {
      if (!userId) throw new Error("Not signed in");
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
        .eq("user_id", userId);
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

export function useAddManualBook() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { userId } = useSupabaseUserId();
  return useMutation({
    mutationFn: async (input: AddManualBookInput) => {
      if (!userId) throw new Error("Not signed in");
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
        user_id: userId,
        book_id: bookRow.id,
        status: input.setCurrentlyReading ? status : "reading",
        updated_at: new Date().toISOString(),
      };
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
  const { userId, isSignedIn } = useSupabaseUserId();
  return useQuery<JourneyEntry[]>({
    enabled: !!isSignedIn && !!userId,
    queryKey: ["bookkase", "journey", userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from(TABLES.journey)
        .select(`*, book:${TABLES.books}(${BOOK_COLUMNS})`)
        .eq("user_id", userId)
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
  const { userId } = useSupabaseUserId();
  return useMutation({
    mutationFn: async (input: UpdateProgressInput) => {
      if (!userId) throw new Error("Not signed in");
      const id = genId();
      const createdAt = new Date().toISOString();
      devLog("update progress", { id, ...input });
      await enqueueWrite({
        kind: "progress",
        id,
        userId,
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
  const { userId } = useSupabaseUserId();
  return useMutation({
    mutationFn: async (input: AddMomentInput) => {
      if (!userId) throw new Error("Not signed in");
      const id = genId();
      const createdAt = new Date().toISOString();
      devLog("add moment", { id, ...input });
      await enqueueWrite({
        kind: "moment",
        id,
        userId,
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
  const { userId } = useSupabaseUserId();
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!userId) throw new Error("Not signed in");
      devLog("delete journey entry", { entryId });
      const { error } = await supabase
        .from(TABLES.journey)
        .delete()
        .eq("id", entryId)
        .eq("user_id", userId);
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
  const { userId } = useSupabaseUserId();
  return useMutation({
    mutationFn: async (input: UpdateJourneyEntryInput) => {
      if (!userId) throw new Error("Not signed in");
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
        .eq("user_id", userId);
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

export function useReadingPlan() {
  const supabase = useSupabase();
  const { userId, isSignedIn } = useSupabaseUserId();
  return useQuery<ReadingPlanEntry[]>({
    enabled: !!isSignedIn && !!userId,
    queryKey: ["bookkase", "reading-plan", userId],
    queryFn: async () => {
      if (!userId) return [];
      const select = `*, book:${TABLES.books}(${BOOK_COLUMNS})`;
      let res = await supabase
        .from(TABLES.readingPlan)
        .select(select)
        .eq("user_id", userId)
        .order("scheduled_year", { ascending: true })
        .order("scheduled_month", { ascending: true })
        .order("position", { ascending: true });
      if (res.error) {
        const msg = (res.error.message ?? "").toLowerCase();
        if (/column .*position|does not exist|schema cache/.test(msg)) {
          res = await supabase
            .from(TABLES.readingPlan)
            .select(select)
            .eq("user_id", userId)
            .order("scheduled_year", { ascending: true })
            .order("scheduled_month", { ascending: true })
            .order("created_at", { ascending: true });
        }
      }
      if (res.error) {
        if (DEV) console.error("[bookkase] reading plan load failed", res.error);
        throw res.error;
      }
      devLog("reading plan loaded", { count: res.data?.length ?? 0 });
      return (res.data ?? []) as unknown as ReadingPlanEntry[];
    },
  });
}

export interface SetCurrentlyReadingByBookInput {
  bookId: string;
  isAudio?: boolean;
}

export function useSetCurrentlyReadingByBookId() {
  const supabase = useSupabase();
  const qc = useQueryClient();
  const { userId } = useSupabaseUserId();
  return useMutation({
    mutationFn: async ({ bookId, isAudio }: SetCurrentlyReadingByBookInput) => {
      if (!userId) throw new Error("Not signed in");
      const nextStatus: BookStatus = isAudio ? "listening" : "reading";
      const now = new Date().toISOString();

      const { data: existing, error: findErr } = await supabase
        .from(TABLES.userBooks)
        .select("id")
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .maybeSingle();
      if (findErr) {
        if (DEV) console.error("[bookkase] find user_book failed", findErr);
        throw findErr;
      }

      if (existing?.id) {
        const { error } = await supabase
          .from(TABLES.userBooks)
          .update({ status: nextStatus, updated_at: now })
          .eq("id", existing.id)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(TABLES.userBooks)
          .insert({
            user_id: userId,
            book_id: bookId,
            status: nextStatus,
            updated_at: now,
          });
        if (error) throw error;
      }
      return { bookId, status: nextStatus };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookkase", "active-books"] });
      qc.invalidateQueries({ queryKey: ["bookkase", "library-books"] });
    },
  });
}
