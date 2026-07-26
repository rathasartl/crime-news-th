import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { timeAgoTh } from "@/lib/time-ago";
import { CategoryBadge } from "./CategoryBadge";
import { SourceBadge, TranslationBadge } from "./SourceBadge";

interface Props {
  article: Article;
  variant?: "hero" | "standard";
  priority?: boolean;
  index?: number;
}

export function ArticleCard({ article, variant = "standard", priority = false, index = 0 }: Props) {
  if (variant === "hero") return <HeroArticle article={article} priority={priority} />;
  return <StandardArticle article={article} priority={priority} index={index} />;
}

function MetaRow({ article }: { article: Article }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--color-muted)]">
      {article.category && (
        <CategoryBadge category={article.category} confidence={article.confidence} size="xs" />
      )}
      {article.is_translated && article.source_language && (
        <TranslationBadge from={article.source_language} />
      )}
      {article.source && (
        <SourceBadge
          slug={article.source.slug}
          name={article.source.name}
          emoji={article.source.emoji}
        />
      )}
      <span aria-hidden className="text-[var(--color-rule)]">·</span>
      <time dateTime={article.published_at} className="font-num">
        {timeAgoTh(article.published_at)}
      </time>
    </div>
  );
}

function HeroArticle({ article, priority }: { article: Article; priority: boolean }) {
  return (
    <article className="fade-up" style={{ animationDelay: "0ms" }}>
      <Link
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {article.image_url ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-rule-soft)]">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ) : (
          <Placeholder imageless />
        )}
      </Link>

      <div className="mt-3">
        <MetaRow article={article} />
        <h2 className="hero-headline mt-2 text-[28px] text-[var(--color-ink)] text-balance">
          <Link
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[image:linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 hover:bg-[length:100%_1px]"
          >
            {article.title}
          </Link>
        </h2>
        {article.summary_th && (
          <p className="lead-text mt-2 text-[15px] text-[var(--color-ink-soft)] text-pretty">
            {article.summary_th}
          </p>
        )}
        {article.location && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            📍 {article.location}
          </p>
        )}
      </div>
    </article>
  );
}

function StandardArticle({
  article,
  priority,
  index
}: {
  article: Article;
  priority: boolean;
  index: number;
}) {
  const hasImage = Boolean(article.image_url);
  return (
    <article
      className="fade-up flex gap-3 py-4"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="min-w-0 flex-1">
        <MetaRow article={article} />
        <h3 className="article-headline mt-1.5 text-[17px] text-[var(--color-ink)] text-balance">
          <Link
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[image:linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 hover:bg-[length:100%_1px]"
          >
            {article.title}
          </Link>
        </h3>
        {article.summary_th && (
          <p className="lead-text mt-1 line-clamp-2 text-[13.5px] text-[var(--color-ink-soft)]">
            {article.summary_th}
          </p>
        )}
      </div>

      {hasImage && (
        <Link
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative h-[78px] w-[110px] shrink-0 overflow-hidden rounded-lg bg-[var(--color-rule-soft)]"
          aria-label={article.title}
        >
          <Image
            src={article.image_url!}
            alt=""
            fill
            priority={priority}
            sizes="110px"
            className="object-cover"
          />
        </Link>
      )}
    </article>
  );
}

function Placeholder({ imageless = false }: { imageless?: boolean }) {
  if (imageless) {
    return (
      <div className="aspect-[16/10] w-full rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--color-paper-warm)] to-[var(--color-rule-soft)]" />
    );
  }
  return null;
}
