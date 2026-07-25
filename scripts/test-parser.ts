import { fetchFeed, parseFeed } from "../lib/fetch-rss";
import { hashContent } from "../lib/content-hash";

async function main() {
  const sources = [
    ["khaosod", "https://www.khaosod.co.th/feed"],
    ["khaosod-crime", "https://www.khaosod.co.th/crime/feed"],
    ["inn", "https://www.innnews.co.th/feed/"],
    ["brighttv", "https://www.brighttv.co.th/feed"]
  ];

  for (const [slug, url] of sources) {
    try {
      console.log(`\n=== ${slug} (${url}) ===`);
      const items = await fetchFeed(url);
      console.log(`parsed ${items.length} items`);
      if (items.length > 0) {
        const first = items[0];
        console.log(`first.title: ${first.title}`);
        console.log(`first.url: ${first.url}`);
        console.log(`first.publishedAt: ${first.publishedAt.toISOString()}`);
        console.log(`first.imageUrl: ${first.imageUrl ?? "(none)"}`);
        console.log(`first.rawExcerpt (100c): ${(first.rawExcerpt ?? "").slice(0, 100)}...`);
        console.log(`hash: ${hashContent(first.title, first.url)}`);
      }
    } catch (err) {
      console.error(`FAILED ${slug}:`, err instanceof Error ? err.message : err);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
