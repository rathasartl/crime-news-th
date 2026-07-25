import Link from "next/link";
import type { Article } from "@/lib/types";
import { timeAgoTh } from "@/lib/time-ago";
import { CategoryBadge } from "./CategoryBadge";
import { SourceBadge } from "./SourceBadge";

export function ArticleCard({ article, priority = false }: { article: Article; priority?: boolean }) {
  const publishedText = timeAgoTh(article.published_at);
  return (
    <article className="border-b border-[var(--color-rule)] py-5 last:border-b-0">
      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
        {article.category && (
          <CategoryBadge category={article.category} confidence={article.confidence} />
        )}
        {article.source && <SourceBadge slug={article.source.slug} name={article.source.name} />}
        <span aria-hidden>·</span>
        <time dateTime={article.published_at}>{publishedText}</time>
      </div>

      <h2 className="font-serif text-lg leading-snug text-[var(--color-ink)] text-balance">
        <Link
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {article.title}
        </Link>
      </h2>

      {article.summary_th && (
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink)]/85 text-pretty">
          {article.summary_th}
        </p>
      )}

      {article.location && (
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          📍 {article.location}
        </p>
      )}
    </article>
  );
}
