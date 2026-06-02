import { get, set } from "idb-keyval";
import type { SupabaseClient } from "@supabase/supabase-js";

import { TABLES, COMPANION_SOURCE, type BookStatus, type ProgressType } from "./schema";

const QUEUE_KEY = "bookkase:companion:pending-writes:v1";

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
      createdAt: string;
      attempts: number;
    };

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
  // dedupe by id
  if (!q.find((x) => x.id === w.id)) {
    q.push(w);
    await saveQueue(q);
    emit();
  }
}

/** Drain the queue, attempting each write. Returns {synced, failed}. */
export async function flushQueue(
  supabase: SupabaseClient
): Promise<{ synced: number; failed: number }> {
  const q = await loadQueue();
  if (q.length === 0) return { synced: 0, failed: 0 };

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
  emit();
  return { synced, failed };
}

async function runOne(supabase: SupabaseClient, item: QueuedWrite) {
  if (item.kind === "progress") {
    // 1. upsert user_books row (status + progress)
    const ub = await supabase
      .from(TABLES.userBooks)
      .upsert(
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
    if (ub.error) throw ub.error;

    // 2. journey entry (id used for dedupe)
    const j = await supabase.from(TABLES.journey).upsert(
      {
        id: item.id,
        user_id: item.userId,
        book_id: item.bookId,
        source: COMPANION_SOURCE,
        entry_type:
          item.status === "finished"
            ? "finished"
            : item.status === "dnf"
            ? "status"
            : "progress",
        progress_type: item.progressType,
        progress_value: item.progressValue,
        note: item.note,
        created_at: item.createdAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
    if (j.error) throw j.error;
  } else {
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
        created_at: item.createdAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
    if (j.error) throw j.error;
  }
}
