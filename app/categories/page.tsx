import Link from "next/link";
import { getFeed } from "@/lib/queries";
import { BROWSABLE_CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { CATEGORY_LABEL_TH, type CrimeCategory } from "@/lib/types";
import { TabBar } from "@/components/TabBar";

export const revalidate = 60;
export const dynamicParams = true;

export default async function CategoriesPage() {
  const { categoryCounts } = await getFeed({ limit: 1 });
  const total = Object.values(categoryCounts).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-32 pt-6">
      <header className="mb-6 border-b border-[var(--color-ink)] pb-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
              เมนูหมวดหมู่
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
              เลือกหมวดข่าวอาชญากรรม
            </h1>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-[var(--color-rule)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
          >
            ← หน้าแรก
          </Link>
        </div>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          ทั้งหมด <span className="font-num font-semibold text-[var(--color-ink)]">{total}</span> เรื่องใน 24 ชม.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/"
          className="group flex flex-col rounded-2xl border border-[var(--color-ink)] bg-[var(--color-ink)] p-4 text-white transition hover:bg-[var(--color-ink-soft)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📰</span>
            <span className="font-num text-2xl font-semibold">{total}</span>
          </div>
          <p className="mt-3 font-serif text-xl font-semibold">ทั้งหมด</p>
          <p className="mt-1 text-xs text-white/70">ดูทุกเรื่องรวมกัน ไม่กรองหมวด</p>
        </Link>

        {BROWSABLE_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.slug] ?? 0;
          const isHighlighted = count > 0;
          return (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              className={
                "group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition " +
                (isHighlighted
                  ? "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)] hover:shadow-[var(--shadow-lift)]"
                  : "border-[var(--color-rule)] bg-[var(--color-paper-warm)] opacity-70 hover:opacity-100")
              }
              style={
                {
                  "--cat-color": `var(--color-cat-${cat.slug === "white_collar" ? "collar" : cat.slug === "theft_robbery" ? "theft" : cat.slug === "fraud_scam" ? "fraud" : cat.slug === "cybercrime" ? "cyber" : cat.slug === "other_crime" ? "other" : cat.slug})`
                } as React.CSSProperties
              }
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{
                    backgroundColor: `color-mix(in oklch, var(--cat-color) 14%, white)`,
                    color: `color-mix(in oklch, var(--cat-color) 78%, black)`
                  }}
                >
                  {cat.icon}
                </span>
                <span
                  className="font-num text-2xl font-semibold"
                  style={{ color: isHighlighted ? "var(--color-ink)" : "var(--color-muted)" }}
                >
                  {count}
                </span>
              </div>
              <p className="mt-3 font-serif text-lg font-semibold leading-tight text-[var(--color-ink)]">
                {cat.label_th}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                {cat.label_en}
              </p>
              <p className="lead-text mt-2 line-clamp-2 text-xs text-[var(--color-ink-soft)]">
                {cat.description}
              </p>
              {isHighlighted && (
                <span
                  className="absolute right-0 top-0 h-1 w-full"
                  style={{
                    background: `linear-gradient(to right, var(--cat-color), transparent)`
                  }}
                  aria-hidden
                />
              )}
            </Link>
          );
        })}
      </div>

      <p className="mt-8 border-t border-[var(--color-rule)] pt-4 text-[11px] text-[var(--color-muted)]">
        หมวดที่ไม่มีเลข (จาง ๆ) = ยังไม่มีข่าวใน 24 ชม. นี้.
        เปิดใช้ AI tagging เพื่อแยกหมวดอัตโนมัติ — เพิ่ม ANTHROPIC_API_KEY แล้วจะกระจายข่าวไปทุกหมวด.
      </p>

      <TabBar active="categories" />
    </main>
  );
}
