export function SourceBadge({
  slug,
  name,
  emoji,
  withDot = true
}: {
  slug: string;
  name: string;
  emoji?: string | null;
  withDot?: boolean;
}) {
  const hue = Array.from(slug).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const color = `oklch(42% 0.04 ${hue})`;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color }}>
      {emoji && <span aria-hidden className="text-[10px] leading-none">{emoji}</span>}
      {withDot && !emoji && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      )}
      {name}
    </span>
  );
}

export function TranslationBadge({ from = "en" }: { from?: string }) {
  const label =
    from === "en" ? "แปลจากอังกฤษ" :
    from === "zh" ? "แปลจากจีน" :
    from === "ja" ? "แปลจากญี่ปุ่น" :
    from === "ko" ? "แปลจากเกาหลี" :
    from === "ar" ? "แปลจากอาหรับ" :
    from === "es" ? "แปลจากสเปน" :
    from === "fr" ? "แปลจากฝรั่งเศส" :
    from === "de" ? "แปลจากเยอรมัน" :
    from === "ru" ? "แปลจากรัสเซีย" :
    from === "vi" ? "แปลจากเวียดนาม" :
    "แปลจากต่างประเทศ";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-paper-warm)] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[var(--color-muted)]"
      title={label}
    >
      🌐 {label}
    </span>
  );
}
