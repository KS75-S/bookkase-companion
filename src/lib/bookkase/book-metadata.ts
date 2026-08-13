import { get, set } from "idb-keyval";

/**
 * Client for the BookKase "companion book metadata" endpoint:
 *   PATCH {BOOKKASE_BASE_URL}/api/companion/book-metadata
 *
 * The server performs an additive, case-insensitive union — existing values
 * on the book are never removed. Removal is intentionally out of scope here.
 */

export interface BookMetadataFields {
  moods?: string[];
  tags?: string[];
  tropes?: string[];
  contentWarnings?: string[];
}

export type MetadataErrorKind =
  | "unauthorized"
  | "badRequest"
  | "notFound"
  | "rateLimited"
  | "network"
  | "unknown";

export type PatchResult =
  | { ok: true; merged: Required<BookMetadataFields> }
  | { ok: false; kind: MetadataErrorKind; status?: number; retryAfterSeconds?: number; message?: string };

/** Terminal failures should never be retried from the offline queue. */
export function isTerminal(kind: MetadataErrorKind): boolean {
  return kind === "badRequest" || kind === "notFound";
}

const FIELDS = ["moods", "tags", "tropes", "contentWarnings"] as const;

/** Trim, drop blanks, and de-dupe (case-insensitively) within a single row. */
export function cleanValues(values: string[] | undefined): string[] {
  if (!values) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export function hasAnyValue(fields: BookMetadataFields): boolean {
  return FIELDS.some((f) => cleanValues(fields[f]).length > 0);
}

/** Merge two metadata payloads (used when queueing repeat saves for a book). */
export function mergeFields(a: BookMetadataFields, b: BookMetadataFields): BookMetadataFields {
  const out: BookMetadataFields = {};
  for (const f of FIELDS) {
    const merged = cleanValues([...(a[f] ?? []), ...(b[f] ?? [])]);
    if (merged.length > 0) out[f] = merged;
  }
  return out;
}

export async function patchBookMetadata(args: {
  baseUrl: string;
  token: string | null;
  bookId: string;
  fields: BookMetadataFields;
}): Promise<PatchResult> {
  const { baseUrl, token, bookId, fields } = args;

  if (!token) return { ok: false, kind: "unauthorized" };
  if (!baseUrl) {
    return { ok: false, kind: "badRequest", message: "BookKase URL is not configured" };
  }

  const body: Record<string, unknown> = { bookId };
  for (const f of FIELDS) {
    const values = cleanValues(fields[f]);
    if (values.length > 0) body[f] = values;
  }
  if (Object.keys(body).length === 1) {
    return { ok: false, kind: "badRequest", message: "Nothing to save" };
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/companion/book-metadata`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[bookkase] book-metadata network failure", err);
    return { ok: false, kind: "network" };
  }

  if (res.ok) {
    let merged: Required<BookMetadataFields> = {
      moods: [],
      tags: [],
      tropes: [],
      contentWarnings: [],
    };
    try {
      const json = (await res.json()) as Partial<Required<BookMetadataFields>>;
      merged = {
        moods: json.moods ?? [],
        tags: json.tags ?? [],
        tropes: json.tropes ?? [],
        contentWarnings: json.contentWarnings ?? [],
      };
    } catch {
      /* response body is optional for our purposes */
    }
    return { ok: true, merged };
  }

  const status = res.status;
  if (status === 401) return { ok: false, kind: "unauthorized", status };
  if (status === 400) {
    const text = await res.text().catch(() => "");
    console.error("[bookkase] book-metadata 400 — bad request from companion", text);
    return { ok: false, kind: "badRequest", status, message: text };
  }
  if (status === 403 || status === 404) return { ok: false, kind: "notFound", status };
  if (status === 429) {
    const retry = parseInt(res.headers.get("Retry-After") ?? "", 10);
    return {
      ok: false,
      kind: "rateLimited",
      status,
      retryAfterSeconds: Number.isFinite(retry) ? retry : 30,
    };
  }
  return { ok: false, kind: "unknown", status };
}

/* ------------------------------------------------------------------ */
/* Pending-save queue — one entry per book, drained on open/reconnect. */
/* ------------------------------------------------------------------ */

const PENDING_KEY = "bookkase:companion:pending-metadata:v1";

export interface PendingMetadata {
  bookId: string;
  bookTitle: string | null;
  fields: BookMetadataFields;
  queuedAt: string;
}

async function loadPending(): Promise<PendingMetadata[]> {
  return (await get<PendingMetadata[]>(PENDING_KEY)) ?? [];
}

async function savePending(items: PendingMetadata[]) {
  await set(PENDING_KEY, items);
}

export async function getPendingMetadataCount(): Promise<number> {
  return (await loadPending()).length;
}

/** Queue (or merge into) the pending save for a book. */
export async function enqueueMetadata(item: Omit<PendingMetadata, "queuedAt">) {
  const items = await loadPending();
  const existing = items.find((i) => i.bookId === item.bookId);
  if (existing) {
    existing.fields = mergeFields(existing.fields, item.fields);
    existing.queuedAt = new Date().toISOString();
  } else {
    items.push({ ...item, queuedAt: new Date().toISOString() });
  }
  await savePending(items);
}

/** Attempt every pending save. Terminal failures are dropped, not retried. */
export async function flushMetadataQueue(args: {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}): Promise<{ synced: number; failed: number }> {
  const items = await loadPending();
  if (items.length === 0) return { synced: 0, failed: 0 };

  const token = await args.getToken();
  const remaining: PendingMetadata[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    const res = await patchBookMetadata({
      baseUrl: args.baseUrl,
      token,
      bookId: item.bookId,
      fields: item.fields,
    });
    if (res.ok) {
      synced++;
    } else if (isTerminal(res.kind)) {
      console.warn("[bookkase] dropping pending metadata for", item.bookId, res.kind);
      failed++;
    } else {
      failed++;
      remaining.push(item);
    }
  }

  await savePending(remaining);
  return { synced, failed };
}
