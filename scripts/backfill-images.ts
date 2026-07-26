import { extractOgImage } from "../lib/fetch-rss";
import { getServerSupabase } from "../lib/supabase-server";

const BATCH_SIZE = Number(process.env.IMAGE_BATCH ?? "200");
const CONCURRENCY = 4;

interface ArticleRow {
  id: string;
  url: string;
}

async function main() {
  const startedAt = Date.now();
  const sb = getServerSupabase();

  console.log(`[images] fetching up to ${BATCH_SIZE} articles with null image_url...`);

  const { data, error } = await sb
    .from("articles")
    .select("id, url")
    .is("image_url", null)
    .order("published_at", { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    console.error(`[images] query failed: ${error.message}`);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log("[images] nothing to backfill — every article already has an image");
    return;
  }

  const rows = data as ArticleRow[];
  console.log(`[images] ${rows.length} articles to fetch images for`);

  let updated = 0;
  let skipped = 0;
  let active = 0;
  const queue = [...rows];

  await new Promise<void>((resolve) => {
    const launch = () => {
      while (active < CONCURRENCY && queue.length > 0) {
        const article = queue.shift()!;
        active++;
        extractOgImage(article.url)
          .then(async (imageUrl) => {
            if (imageUrl) {
              const { error: updateError } = await sb
                .from("articles")
                .update({ image_url: imageUrl })
                .eq("id", article.id);
              if (updateError) {
                console.error(`[images] ${article.id} update failed: ${updateError.message}`);
              } else {
                updated++;
                if (updated % 25 === 0) {
                  console.log(`[images] ${updated}/${rows.length} updated`);
                }
              }
            } else {
              skipped++;
            }
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[images] ${article.id} fetch failed: ${msg}`);
            skipped++;
          })
          .finally(() => {
            active--;
            if (queue.length === 0 && active === 0) resolve();
            else launch();
          });
      }
    };
    launch();
  });

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[images] done: ${updated} updated, ${skipped} skipped in ${elapsed}s`);
}

main().catch((err) => {
  console.error("[images] fatal:", err);
  process.exit(1);
});
