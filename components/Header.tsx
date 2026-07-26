import Link from "next/link";
import {
  CATEGORY_CSS_VAR,
  CATEGORY_LABEL_TH,
  CATEGORY_ORDER,
  type CrimeCategory
} from "@/lib/types";
import { BROWSABLE_CATEGORIES } from "@/lib/categories";
import type { LanguageScope } from "@/lib/queries";

interface Props {
  count: number;
  activeCategory: CrimeCategory | null;
  activeLang: LanguageScope;
  categoryCounts: Partial<Record<CrimeCategory, number>>;
  lastUpdated: Date;
}

export function Header({
  count,
  activeCategory,
  activeLang,
  categoryCounts,
  lastUpdated
}: Props) {
  return (
    <header className="sticky top-0 z-30 -mx-5 mb-2 bg-[var(--color-paper)]/85 px-5 pb-2 pt-4 backdrop-blur-xl">
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-ink)] pb-3">
        <div>
          <h1 className="font-serif text-[26px] font-semibold leading-none tracking-tight text-[var(--color-ink)]">
            อาชญากรรม
          </h1>
          <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">
            ฟีดข่าว · อัปเดต {fmtTime(lastUpdated)} น.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[15px] font-semibold text-[var(--color-ink)] font-num">
            {count}
          </p>
          <p className="text-[10px] text-[var(--color-muted)]">เรื่อง 7 วัน</p>
        </div>
      </div>

      <LanguageFilter activeLang={activeLang} activeCategory={activeCategory} />
      <CategoryFilter
        activeCategory={activeCategory}
        activeLang={activeLang}
        categoryCounts={categoryCounts}
        total={count}
      />
    </header>
  );
}

function buildLangHref(lang: LanguageScope, activeCategory: CrimeCategory | null): string {
  const params = new URLSearchParams();
  if (lang !== "all") params.set("lang", lang);
  if (activeCategory) params.set("category", activeCategory);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

function LanguageFilter({
  activeLang,
  activeCategory
}: {
  activeLang: LanguageScope;
  activeCategory: CrimeCategory | null;
}) {
  const tabs: { value: LanguageScope; label: string }[] = [
    { value: "all", label: "ทั้งหมด" },
    { value: "thai", label: "🇹🇭 ไทย" },
    { value: "intl", label: "🌏 ต่างประเทศ" }
  ];
  return (
    <div className="mt-3 flex gap-1" role="tablist" aria-label="ภาษา/แหล่งข่าว">
      {tabs.map((t) => {
        const active = activeLang === t.value;
        return (
          <Link
            key={t.value}
            href={buildLangHref(t.value, activeCategory)}
            scroll={false}
            role="tab"
            aria-selected={active}
            className={
              "rounded-md px-3 py-1 text-[12px] font-medium transition " +
              (active
                ? "bg-[var(--color-ink)] text-white"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

function CategoryFilter({
  activeCategory,
  activeLang,
  categoryCounts,
  total
}: {
  activeCategory: CrimeCategory | null;
  activeLang: LanguageScope;
  categoryCounts: Partial<Record<CrimeCategory, number>>;
  total: number;
}) {
  const visible = BROWSABLE_CATEGORIES.filter(
    (c) => (categoryCounts[c.slug] ?? 0) > 0 || activeCategory === c.slug
  );

  return (
    <nav
      aria-label="หมวดหมู่"
      className="no-scrollbar -mx-5 mt-2 flex gap-1.5 overflow-x-auto px-5 pb-1"
    >
      <Pill href={buildLangHref(activeLang, null)} active={activeCategory === null} count={total}>
        ทั้งหมด
      </Pill>
      {visible.map((c) => {
        const count = categoryCounts[c.slug] ?? 0;
        return (
          <Pill
            key={c.slug}
            href={buildLangHref(activeLang, c.slug)}
            active={activeCategory === c.slug}
            count={count}
            category={c.slug}
          >
            <span aria-hidden className="mr-0.5 text-[10px]">{c.icon}</span>
            {c.label_th}
          </Pill>
        );
      })}
      <Link
        href="/categories"
        scroll={false}
        className="flex shrink-0 items-center rounded-full border border-dashed border-[var(--color-rule)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-muted)] transition hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink-soft)]"
      >
        เมนู ↗
      </Link>
    </nav>
  );
}

function Pill({
  href,
  active,
  count,
  category,
  children
}: {
  href: string;
  active: boolean;
  count: number;
  category?: CrimeCategory;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition " +
        (active
          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
          : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]")
      }
      style={
        category && active
          ? ({ backgroundColor: "var(--color-ink)" } as React.CSSProperties)
          : undefined
      }
    >
      {category && !active && (
        <span
          aria-hidden
          className="inline-block h-1 w-1 rounded-full"
          style={{ backgroundColor: `var(${CATEGORY_CSS_VAR[category]})` }}
        />
      )}
      <span>{children}</span>
      <span
        className={
          "font-num text-[10px] " +
          (active ? "text-white/70" : "text-[var(--color-muted)]")
        }
      >
        {count}
      </span>
    </Link>
  );
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
