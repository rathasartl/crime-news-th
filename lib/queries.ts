import { getServerSupabase } from "./supabase-server";
import type { Article, CrimeCategory } from "./types";

const DEFAULT_LIMIT = 60;
const DEFAULT_HOURS = 24 * 7; // 1 week window for the feed

export interface FeedOptions {
  limit?: number;
  hours?: number;
  category?: CrimeCategory;
  includeNotCrime?: boolean;
  sourceSlug?: string;
}

export async function getArticles(opts: FeedOptions = {}): Promise<Article[]> {
  const sb = getServerSupabase();
  const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, 200);
  const hours = opts.hours ?? DEFAULT_HOURS;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  let q = sb
    .from("articles")
    .select(
      "id, source_id, url, title, raw_excerpt, content_html, image_url, published_at, summary_th, category, confidence, location, click_count, hidden, source:sources(slug, name)"
    )
    .eq("hidden", false)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (!opts.includeNotCrime) {
    q = q.neq("category", "not_crime");
  }
  if (opts.category) {
    q = q.eq("category", opts.category);
  }
  if (opts.sourceSlug) {
    // requires join filter — do client-side for simplicity
  }

  const { data, error } = await q;
  if (error) throw new Error(`getArticles: ${error.message}`);

  const rows = (data ?? []) as unknown as Array<
    Omit<Article, "source"> & { source: { slug: string; name: string } | null }
  >;

  return rows.map((r) => ({
    ...r,
    source: r.source ?? undefined
  }));
}

export async function getArticleById(id: string): Promise<Article | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from("articles")
    .select(
      "id, source_id, url, title, raw_excerpt, content_html, image_url, published_at, summary_th, category, confidence, location, click_count, hidden, source:sources(slug, name)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getArticleById: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    source_id: string;
    url: string;
    title: string;
    raw_excerpt: string | null;
    content_html: string | null;
    image_url: string | null;
    published_at: string;
    summary_th: string | null;
    category: CrimeCategory | null;
    confidence: number | null;
    location: string | null;
    click_count: number;
    hidden: boolean;
    source: { slug: string; name: string } | { slug: string; name: string }[] | null;
  };
  const src = Array.isArray(row.source) ? row.source[0] : row.source;
  return { ...row, source: src ?? undefined };
}

export async function registerClick(id: string): Promise<void> {
  const sb = getServerSupabase();
  await sb.rpc("increment_click_count", { article_id: id }).throwOnError();
}
