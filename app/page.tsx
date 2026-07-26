import { getFeed } from "@/lib/queries";
import type { CrimeCategory } from "@/lib/types";
import { Feed } from "@/components/Feed";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";

export const revalidate = 60;
export const dynamicParams = true;

const VALID_CATEGORIES: CrimeCategory[] = [
  "murder", "theft_robbery", "fraud_scam", "drugs", "cybercrime",
  "white_collar", "sexual", "traffic", "other_crime"
];

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catParam = typeof params.category === "string" ? params.category : null;
  const category: CrimeCategory | null =
    catParam && VALID_CATEGORIES.includes(catParam as CrimeCategory)
      ? (catParam as CrimeCategory)
      : null;

  const { articles, categoryCounts } = await getFeed({
    category,
    limit: 30
  });

  return (
    <main className="mx-auto max-w-2xl px-5 pb-32">
      <Header
        count={Object.values(categoryCounts).reduce((s, n) => s + (n ?? 0), 0)}
        activeCategory={category}
        categoryCounts={categoryCounts}
        lastUpdated={new Date()}
      />
      <Feed articles={articles} hasCategoryFilter={category !== null} />
      <Footer />
      <TabBar active="home" />
    </main>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-[var(--color-rule)] pt-6 text-[11px] text-[var(--color-muted)]">
      <p className="font-medium text-[var(--color-ink-soft)]">🇹🇭 ไทย</p>
      <p className="mt-1">
        <a className="underline" href="https://www.khaosod.co.th" target="_blank" rel="noopener">ข่าวสด</a>{" · "}
        <a className="underline" href="https://www.prachachat.net" target="_blank" rel="noopener">ประชาชาติ</a>{" · "}
        <a className="underline" href="https://thestandard.co" target="_blank" rel="noopener">เดอะสแตนดาร์ด</a>{" · "}
        <a className="underline" href="https://www.brighttv.co.th" target="_blank" rel="noopener">ไบรท์ทีวี</a>{" · "}
        <a className="underline" href="https://www.innnews.co.th" target="_blank" rel="noopener">เอ็นเน็วส์</a>
      </p>
      <p className="mt-3 font-medium text-[var(--color-ink-soft)]">🌏 ต่างประเทศ (อังกฤษ → แปลไทยอัตโนมัติ)</p>
      <p className="mt-1">
        <a className="underline" href="https://www.bbc.com/news/world" target="_blank" rel="noopener">BBC World</a>{" · "}
        <a className="underline" href="https://www.theguardian.com/world" target="_blank" rel="noopener">The Guardian</a>{" · "}
        <a className="underline" href="https://www.nytimes.com/section/world" target="_blank" rel="noopener">NYT World</a>{" · "}
        <a className="underline" href="https://www.aljazeera.com" target="_blank" rel="noopener">Al Jazeera</a>{" · "}
        <a className="underline" href="https://abcnews.go.com/International" target="_blank" rel="noopener">ABC</a>{" · "}
        <a className="underline" href="https://www.cbsnews.com/world" target="_blank" rel="noopener">CBS</a>
      </p>
      <p className="mt-3">
        <a
          className="underline"
          href="https://github.com/rathasartl/crime-news-th"
          target="_blank"
          rel="noopener"
        >
          source
        </a>{" · "}อัปเดตอัตโนมัติทุก 5 นาที
      </p>
    </footer>
  );
}
