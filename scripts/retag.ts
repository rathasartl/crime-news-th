import { summarize, isAIDisabled } from "../lib/summarize";
import { getServerSupabase } from "../lib/supabase-server";
import type { FetchedItem, CrimeCategory } from "../lib/types";

const BATCH_SIZE = Number(process.env.RETAG_BATCH ?? "100");
const SUMMARIZE_CONCURRENCY = 3;

interface ArticleRow {
  id: string;
  title: string;
  raw_excerpt: string | null;
  content_html: string | null;
  url: string;
  source_language: string;
}

async function main() {
  if (isAIDisabled()) {
    console.error("[retag] ANTHROPIC_API_KEY missing — set it and re-run");
    process.exit(1);
  }

  const startedAt = Date.now();
  const sb = getServerSupabase();

  console.log(`[retag] fetching up to ${BATCH_SIZE} articles tagged (none) or with low confidence...`);

  const { data, error } = await sb
    .from("articles")
    .select("id, title, raw_excerpt, content_html, url, source_language")
    .or("ai_model.eq.(none),confidence.lt.0.5")
    .order("published_at", { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    console.error(`[retag] query failed: ${error.message}`);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log("[retag] nothing to retag — all articles already AI-tagged");
    return;
  }

  const rows = data as ArticleRow[];
  console.log(`[retag] ${rows.length} articles to re-tag`);

  let processed = 0;
  let updated = 0;
  let active = 0;
  let idx = 0;
  const queue = [...rows];

  await new Promise<void>((resolve) => {
    const launch = () => {
      while (active < SUMMARIZE_CONCURRENCY && queue.length > 0) {
        const article = queue.shift()!;
        active++;
        idx++;
        const jobNum = idx;
        const item: FetchedItem = {
          title: article.title,
          url: article.url,
          publishedAt: new Date(0),
          rawExcerpt: article.raw_excerpt,
          contentHtml: article.content_html,
          imageUrl: null,
          externalId: null
        };
        summarize(item, article.source_language)
          .then(async (ai) => {
            const patch = {
              summary_th: ai.summary_th,
              category: ai.category as CrimeCategory,
              confidence: ai.confidence,
              location: ai.location,
              source_language: ai.source_language,
              is_translated: ai.is_translated,
              ai_model: "claude-haiku-4-5",
              summarized_at: new Date().toISOString()
            };
            const { error: updateError } = await sb
              .from("articles")
              .update(patch)
              .eq("id", article.id);
            if (updateError) {
              console.error(`[retag] #${jobNum} ${article.id} update failed: ${updateError.message}`);
            } else {
              updated++;
              if (updated % 25 === 0) {
                console.log(`[retag] ${updated}/${rows.length} updated`);
              }
            }
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[retag] #${jobNum} ${article.id} summarize failed: ${msg}`);
          })
          .finally(() => {
            processed++;
            active--;
            if (queue.length === 0 && active === 0) resolve();
            else launch();
          });
      }
    };
    launch();
  });

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[retag] done: ${processed} processed, ${updated} updated in ${elapsed}s`);
}

main().catch((err) => {
  console.error("[retag] fatal:", err);
  process.exit(1);
});
