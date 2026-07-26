import { getServerSupabase } from "./supabase-server";
import type { Article, CrimeCategory } from "./types";

const DEFAULT_LIMIT = 60;
const DEFAULT_HOURS = 24;

export interface FeedOptions {
  limit?: number;
  hours?: number;
  category?: CrimeCategory | null;
  includeNotCrime?: boolean;
}

export interface FeedResult {
  articles: Article[];
  categoryCounts: Partial<Record<CrimeCategory, number>>;
}

export async function getArticles(opts: FeedOptions = {}): Promise<Article[]> {
  const result = await getFeed(opts);
  return result.articles;
}

export async function getFeed(opts: FeedOptions = {}): Promise<FeedResult> {
  const sb = getServerSupabase();
  const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, 200);
  const hours = opts.hours ?? DEFAULT_HOURS;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const category = opts.category ?? null;
  const includeNotCrime = opts.includeNotCrime ?? false;

  const [feedRes, countRes] = await Promise.all([
    sb
      .from("articles")
      .select(
        "id, source_id, url, title, raw_excerpt, content_html, image_url, published_at, summary_th, category, confidence, location, click_count, hidden, source:sources(slug, name)"
      )
      .eq("hidden", false)
      .gte("published_at", since)
      .neq("category", includeNotCrime ? "_never_" : "not_crime")
      .order("published_at", { ascending: false })
      .limit(limit)
      .then((r) => {
        if (r.error) throw new Error(`getFeed.articles: ${r.error.message}`);
        return r.data ?? [];
      }),
    sb
      .from("articles")
      .select("category")
      .eq("hidden", false)
      .gte("published_at", since)
      .neq("category", "not_crime")
      .then((r) => {
        if (r.error) throw new Error(`getFeed.counts: ${r.error.message}`);
        return (r.data ?? []) as Pick<Article, "category">[];
      })
  ]);

  const categoryCounts: Partial<Record<CrimeCategory, number>> = {};
  for (const row of countRes) {
    const c = row.category as CrimeCategory;
    if (!c) continue;
    categoryCounts[c] = (categoryCounts[c] ?? 0) + 1;
  }

  const filtered = category
    ? feedRes.filter((a: any) => a.category === category)
    : feedRes;

  const rows = filtered as unknown as Array<
    Omit<Article, "source"> & {
      source: { slug: string; name: string } | { slug: string; name: string }[] | null;
    }
  >;

  const articles = rows.map((r) => ({
    ...r,
    source: Array.isArray(r.source) ? r.source[0] : r.source ?? undefined
  }));

  return { articles, categoryCounts };
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
