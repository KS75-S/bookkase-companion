import { get, set } from "idb-keyval";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

import { TABLES, COMPANION_SOURCE, type BookStatus, type ProgressType } from "./schema";

const QUEUE_KEY = "bookkase:companion:pending-writes:v2";

export type QueuedWrite =
  | {
      kind: "progress";
      id: string; // journey row id (also used as idempotency key)
      userId: string;
      bookId: string;
      status: BookStatus;
      progressType: ProgressType;
      progressValue: string;
      note: string | null;
      createdAt: string;
      attempts: number;
    }
  | {
      kind: "moment";
      id: string;
      userId: string;
      bookId: string;
      progressType: ProgressType | null;
      progressValue: string | null;
      note: string;
      tags: string[];
      createdAt: string;
      attempts: number;
    };


const DEV = import.meta.env.DEV;

function devLog(...args: unknown[]) {
  if (DEV) console.debug("[bookkase]", ...args);
}

async function loadQueue(): Promise<QueuedWrite[]> {
  return (await get<QueuedWrite[]>(QUEUE_KEY)) ?? [];
}

async function saveQueue(q: QueuedWrite[]) {
  await set(QUEUE_KEY, q);
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((fn) => fn());
}
export function subscribeQueue(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function getPendingCount(): Promise<number> {
  return (await loadQueue()).length;
}

export async function enqueueWrite(w: QueuedWrite) {
  const q = await loadQueue();
  if (!q.find((x) => x.id === w.id)) {
    q.push(w);
    await saveQueue(q);
    devLog("enqueued write", { kind: w.kind, id: w.id });
    emit();
  }
}

/** Drain the queue, attempting each write. Returns {synced, failed}. */
export async function flushQueue(
  supabase: SupabaseClient
): Promise<{ synced: number; failed: number }> {
  const q = await loadQueue();
  if (q.length === 0) return { synced: 0, failed: 0 };
  devLog("flushing queue", { size: q.length });

  const remaining: QueuedWrite[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of q) {
    try {
      await runOne(supabase, item);
      synced++;
    } catch (err) {
      console.warn("[bookkase] sync failed for", item.id, err);
      failed++;
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  await saveQueue(remaining);
  devLog("flush complete", { synced, failed, remaining: remaining.length });
  emit();
  return { synced, failed };
}

function describeError(prefix: string, error: PostgrestError): Error {
  return new Error(
    `${prefix}: ${error.message}` +
      (error.code ? ` (code=${error.code})` : "") +
      (error.details ? ` details=${error.details}` : "") +
      (error.hint ? ` hint=${error.hint}` : "")
  );
}

function assertNonEmpty(name: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`[bookkase] missing required field: ${name}`);
  }
}

async function runOne(supabase: SupabaseClient, item: QueuedWrite) {
  if (item.kind === "progress") {
    assertNonEmpty("userId", item.userId);
    assertNonEmpty("bookId", item.bookId);
    assertNonEmpty("status", item.status);

    devLog("upsert user_books", {
      userId: item.userId,
      bookId: item.bookId,
      status: item.status,
      progressType: item.progressType,
      progressValue: item.progressValue,
    });

    const ub = await supabase.from(TABLES.userBooks).upsert(
      {
        user_id: item.userId,
        book_id: item.bookId,
        status: item.status,
        progress_type: item.progressType,
        progress_value: item.progressValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" }
    );
    if (ub.error) throw describeError("user_books upsert failed", ub.error);

    const entryType =
      item.status === "finished"
        ? "finished"
        : item.status === "dnf"
        ? "status"
        : "progress";

    devLog("upsert reading_journey (progress)", {
      id: item.id,
      userId: item.userId,
      bookId: item.bookId,
      entryType,
      progressType: item.progressType,
      progressValue: item.progressValue,
    });

    const j = await supabase.from(TABLES.journey).upsert(
      {
        id: item.id,
        user_id: item.userId,
        book_id: item.bookId,
        source: COMPANION_SOURCE,
        entry_type: entryType,
        progress_type: item.progressType,
        progress_value: item.progressValue,
        note: item.note,
        created_at: item.createdAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
    if (j.error) throw describeError("reading_journey upsert failed", j.error);
  } else {
    assertNonEmpty("userId", item.userId);
    assertNonEmpty("bookId", item.bookId);

    devLog("upsert reading_journey (moment)", {
      id: item.id,
      userId: item.userId,
      bookId: item.bookId,
      progressType: item.progressType,
      progressValue: item.progressValue,
    });

    const j = await supabase.from(TABLES.journey).upsert(
      {
        id: item.id,
        user_id: item.userId,
        book_id: item.bookId,
        source: COMPANION_SOURCE,
        entry_type: "moment",
        progress_type: item.progressType,
        progress_value: item.progressValue,
        note: item.note,
        tags: item.tags && item.tags.length > 0 ? item.tags : null,
        created_at: item.createdAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
    if (j.error) throw describeError("reading_journey upsert failed", j.error);
  }
}
