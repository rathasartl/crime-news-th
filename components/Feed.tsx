import type { Article } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";
import Link from "next/link";

export function Feed({
  articles,
  hasCategoryFilter = false
}: {
  articles: Article[];
  hasCategoryFilter?: boolean;
}) {
  if (articles.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="text-5xl opacity-30">∅</div>
        <p className="mt-4 font-serif text-xl text-[var(--color-ink)]">
          {hasCategoryFilter ? "ไม่มีข่าวในหมวดนี้" : "ยังไม่มีข่าวในระบบ"}
        </p>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          {hasCategoryFilter
            ? "ลองเลือกหมวดอื่น หรือรอสัก 5 นาที"
            : "รอ GitHub Actions cron ทำงาน (ทุก 5 นาที)"}
        </p>
        {!hasCategoryFilter && (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            หรือดูสถานะที่{" "}
            <Link
              href="https://github.com/rathasartl/crime-news-th/actions"
              target="_blank"
              rel="noopener"
              className="underline"
            >
              GitHub Actions
            </Link>
          </p>
        )}
      </div>
    );
  }

  const [hero, ...rest] = articles;
  return (
    <div className="divide-y divide-[var(--color-rule)]">
      <div className="pb-5">
        <ArticleCard article={hero} variant="hero" priority />
      </div>
      {rest.map((a, i) => (
        <ArticleCard key={a.id} article={a} index={i} />
      ))}
    </div>
  );
}
