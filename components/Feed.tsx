import type { Article } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";

export function Feed({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          ยังไม่มีข่าวในระบบ
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          รอ cron ทำงาน หรือรัน <code className="font-mono">bun run fetch-news</code> ด้วยตัวเอง
        </p>
      </div>
    );
  }
  return (
    <div>
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}
