import Link from "next/link";
import {
  CATEGORY_CSS_VAR,
  CATEGORY_LABEL_TH,
  CATEGORY_ORDER,
  type CrimeCategory
} from "@/lib/types";

const CSS_VAR_SUFFIX: Record<CrimeCategory, string> = {
  murder: "murder",
  theft_robbery: "theft",
  fraud_scam: "fraud",
  drugs: "drugs",
  cybercrime: "cyber",
  white_collar: "collar",
  sexual: "sexual",
  traffic: "traffic",
  other_crime: "other",
  not_crime: "none"
};

interface Props {
  count: number;
  activeCategory: CrimeCategory | null;
  categoryCounts: Partial<Record<CrimeCategory, number>>;
  lastUpdated: Date;
}

export function Header({ count, activeCategory, categoryCounts, lastUpdated }: Props) {
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
          <p className="text-[10px] text-[var(--color-muted)]">เรื่อง 24 ชม.</p>
        </div>
      </div>

      <CategoryFilter activeCategory={activeCategory} categoryCounts={categoryCounts} total={count} />
    </header>
  );
}

function CategoryFilter({
  activeCategory,
  categoryCounts,
  total
}: {
  activeCategory: CrimeCategory | null;
  categoryCounts: Partial<Record<CrimeCategory, number>>;
  total: number;
}) {
  return (
    <nav
      aria-label="หมวดหมู่"
      className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1"
    >
      <Pill href="/" active={activeCategory === null} count={total}>
        ทั้งหมด
      </Pill>
      {CATEGORY_ORDER.filter((c) => c !== "not_crime" && (categoryCounts[c] ?? 0) > 0).map(
        (c) => (
          <Pill
            key={c}
            href={`/?category=${c}`}
            active={activeCategory === c}
            count={categoryCounts[c] ?? 0}
            category={c}
          >
            {CATEGORY_LABEL_TH[c]}
          </Pill>
        )
      )}
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
      <span className={"font-num text-[10px] " + (active ? "text-white/70" : "text-[var(--color-muted)]")}>
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
