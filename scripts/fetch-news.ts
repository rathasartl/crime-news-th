import { fetchFeed } from "../lib/fetch-rss";
import { summarize, isAIDisabled } from "../lib/summarize";
import { hashContent } from "../lib/content-hash";
import {
  filterCandidates,
  findExistingHashes,
  getActiveSources,
  insertArticles,
  type ArticleInsert
} from "../lib/db";
import type { FetchedItem } from "../lib/types";

const SUMMARIZE_CONCURRENCY = 3;
const SKIP_NOT_CRIME = process.env.SKIP_NOT_CRIME === "1";
const MAX_AGE_HOURS = Number(process.env.MAX_AGE_HOURS ?? "48");
const AI_DISABLED = isAIDisabled();

interface FetchResult {
  source: string;
  fetched: number;
  inserted: number;
  errors: string[];
  skippedDuplicates: number;
  skippedNotCrime: number;
}

async function main() {
  const startedAt = Date.now();
  console.log(`[fetch-news] start at ${new Date().toISOString()}`);
  if (AI_DISABLED) {
    console.log(`[fetch-news] ⚠ AI disabled — fetching Thai sources only (foreign would be untranslated)`);
  } else {
    console.log(`[fetch-news] ✓ AI enabled — fetching all sources with translation`);
  }

  // When AI disabled, skip non-Thai sources to avoid untranslated English in feed
  const sources = await getActiveSources(!AI_DISABLED);
  if (sources.length === 0) {
    console.warn("[fetch-news] no active sources");
    return;
  }
  console.log(`[fetch-news] ${sources.length} sources to fetch`);

  // Fetch all feeds in parallel (limited by source count, ~6)
  const fetched: Array<{ source: (typeof sources)[number]; items: FetchedItem[]; error?: string }> = [];
  await Promise.all(
    sources.map(async (source) => {
      try {
        const items = await fetchFeed(source.feed_url);
        fetched.push({ source, items });
        console.log(`[fetch-news] ✓ ${source.slug}: ${items.length} items`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fetched.push({ source, items: [], error: msg });
        console.error(`[fetch-news] ✗ ${source.slug}: ${msg}`);
      }
    })
  );

  // Per-source: filter + dedupe + insert
  const results: FetchResult[] = [];
  for (const { source, items, error } of fetched) {
    const result: FetchResult = {
      source: source.slug,
      fetched: items.length,
      inserted: 0,
      errors: error ? [error] : [],
      skippedDuplicates: 0,
      skippedNotCrime: 0
    };
    if (error || items.length === 0) {
      results.push(result);
      continue;
    }

    const candidates = filterCandidates(items, source, MAX_AGE_HOURS);
    if (candidates.length === 0) {
      results.push(result);
      continue;
    }

    // Hash + dedupe query
    const hashed = candidates.map((item) => ({
      item,
      hash: hashContent(item.title, item.url)
    }));

    const existingHashes = await findExistingHashes(
      source.id,
      hashed.map((h) => h.hash)
    );
    const fresh = hashed.filter((h) => !existingHashes.has(h.hash));
    result.skippedDuplicates = hashed.length - fresh.length;

    if (fresh.length === 0) {
      results.push(result);
      continue;
    }

    // Summarize in a bounded pool
    const summarized: ArticleInsert[] = [];
    let active = 0;
    let idx = 0;
    const queue = [...fresh];
    await new Promise<void>((resolve) => {
      const launch = () => {
        while (active < SUMMARIZE_CONCURRENCY && queue.length > 0) {
          const job = queue.shift()!;
          active++;
          idx++;
          const jobNum = idx;
          summarize(job.item, source.language)
            .then((ai) => {
              if (SKIP_NOT_CRIME && ai.category === "not_crime") {
                result.skippedNotCrime++;
                return;
              }
              summarized.push({
                source_id: source.id,
                external_id: job.item.externalId,
                url: job.item.url,
                title: job.item.title,
                raw_excerpt: job.item.rawExcerpt,
                content_html: job.item.contentHtml,
                image_url: job.item.imageUrl,
                published_at: job.item.publishedAt.toISOString(),
                fetched_at: new Date().toISOString(),
                summary_th: ai.summary_th,
                category: ai.category,
                confidence: ai.confidence,
                location: ai.location,
                source_language: ai.source_language,
                is_translated: ai.is_translated,
                ai_model: AI_DISABLED ? "(none)" : "gemini-2.5-flash",
                summarized_at: new Date().toISOString(),
                content_hash: job.hash
              });
            })
            .catch((err) => {
              const msg = err instanceof Error ? err.message : String(err);
              result.errors.push(`summarize #${jobNum}: ${msg}`);
              console.error(`[fetch-news]   summarize error (${source.slug} #${jobNum}): ${msg}`);
            })
            .finally(() => {
              active--;
              if (queue.length === 0 && active === 0) resolve();
              else launch();
            });
        }
      };
      launch();
      if (fresh.length === 0) resolve();
    });

    if (summarized.length > 0) {
      const inserted = await insertArticles(summarized);
      result.inserted = inserted;
    }
    results.push(result);
  }

  // Print summary
  const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  const totalDupes = results.reduce((s, r) => s + r.skippedDuplicates, 0);
  const totalNotCrime = results.reduce((s, r) => s + r.skippedNotCrime, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log("");
  console.log("[fetch-news] ────────────────────────────────");
  for (const r of results) {
    console.log(
      `  ${r.source.padEnd(18)} fetched=${r.fetched} inserted=${r.inserted} dupes=${r.skippedDuplicates} not_crime=${r.skippedNotCrime} errs=${r.errors.length}`
    );
  }
  console.log("");
  console.log(
    `[fetch-news] totals: fetched=${totalFetched} inserted=${totalInserted} duplicates=${totalDupes} not_crime=${totalNotCrime} errors=${totalErrors} in ${elapsed}s`
  );

  // Exit non-zero only if we got ZERO new articles AND every source failed.
  // Per-source timeouts happen regularly (RSS feeds occasionally stall); that's not fatal
  // as long as something is flowing through.
  const totalSuccessfulSources = results.filter((r) => r.errors.length === 0).length;
  if (totalErrors > 0 && totalSuccessfulSources === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[fetch-news] fatal:", err);
  process.exit(1);
});
