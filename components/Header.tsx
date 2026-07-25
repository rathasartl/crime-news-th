import Link from "next/link";

export function Header({ count }: { count: number }) {
  return (
    <header className="mb-6">
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-ink)] pb-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
            อาชญากรรม
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            รวมข่าวอาชญากรรมจากสำนักข่าวไทย อัปเดตทุก 5 นาที
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-[var(--color-muted)]">{count} เรื่อง</p>
          <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">7 วันล่าสุด</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-[var(--color-muted)]">
        แหล่งข่าว:{" "}
        <Link href="https://www.khaosod.co.th" target="_blank" rel="noopener" className="underline">ข่าวสด</Link>
        {" · "}
        <Link href="https://www.prachachat.net" target="_blank" rel="noopener" className="underline">ประชาชาติ</Link>
        {" · "}
        <Link href="https://thestandard.co" target="_blank" rel="noopener" className="underline">เดอะสแตนดาร์ด</Link>
        {" · "}
        <Link href="https://www.brighttv.co.th" target="_blank" rel="noopener" className="underline">ไบรท์ทีวี</Link>
        {" · "}
        <Link href="https://www.innnews.co.th" target="_blank" rel="noopener" className="underline">เอ็นเน็วส์</Link>
      </p>
    </header>
  );
}
