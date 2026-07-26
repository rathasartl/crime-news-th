import { getServerSupabase } from "./supabase-server";
import type { FetchedItem, Source } from "./types";

export interface ArticleInsert {
  source_id: string;
  external_id: string | null;
  url: string;
  title: string;
  raw_excerpt: string | null;
  content_html: string | null;
  image_url: string | null;
  published_at: string;
  fetched_at: string;
  summary_th: string;
  category: string;
  confidence: number;
  location: string | null;
  source_language: string;
  is_translated: boolean;
  ai_model: string;
  summarized_at: string;
  content_hash: string;
}

export async function getActiveSources(includeForeignLanguages: boolean): Promise<Source[]> {
  const sb = getServerSupabase();
  let q = sb
    .from("sources")
    .select("id, slug, name, feed_url, site_url, language, country, emoji, is_active")
    .eq("is_active", true);
  if (!includeForeignLanguages) {
    // Skip non-Thai sources when AI is disabled (can't translate)
    q = q.eq("language", "th");
  }
  const { data, error } = await q.order("name");
  if (error) throw new Error(`Failed to load sources: ${error.message}`);
  return (data ?? []) as Source[];
}

export async function findExistingHashes(
  sourceId: string,
  hashes: string[]
): Promise<Set<string>> {
  if (hashes.length === 0) return new Set();
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("articles")
    .select("content_hash")
    .eq("source_id", sourceId)
    .in("content_hash", hashes);
  if (error) throw new Error(`Failed to query existing hashes: ${error.message}`);
  return new Set((data ?? []).map((r) => r.content_hash as string));
}

export async function findExistingUrls(
  sourceId: string,
  urls: string[]
): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("articles")
    .select("url")
    .eq("source_id", sourceId)
    .in("url", urls);
  if (error) throw new Error(`Failed to query existing urls: ${error.message}`);
  return new Set((data ?? []).map((r) => r.url as string));
}

export async function insertArticles(rows: ArticleInsert[]): Promise<number> {
  if (rows.length === 0) return 0;
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("articles")
    .upsert(rows, {
      onConflict: "source_id,content_hash",
      ignoreDuplicates: true
    })
    .select("id");
  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data?.length ?? 0;
}

/**
 * Filter raw RSS items to those worth processing:
 * - drop future-dated (clock skew > 1h)
 * - drop older than cutoff (default 48h)
 * - drop duplicates within the same batch (same hash)
 */
export function filterCandidates(
  items: FetchedItem[],
  source: Source,
  maxAgeHours = 48
): FetchedItem[] {
  const now = Date.now();
  const seen = new Set<string>();
  const out: FetchedItem[] = [];
  for (const item of items) {
    const ts = item.publishedAt.getTime();
    if (Number.isNaN(ts)) continue;
    if (ts > now + 60 * 60 * 1000) continue; // future
    if (ts < now - maxAgeHours * 60 * 60 * 1000) continue; // too old
    out.push(item);
  }
  return out;
}
