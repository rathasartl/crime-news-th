export function SourceBadge({
  slug,
  name,
  withDot = true
}: {
  slug: string;
  name: string;
  withDot?: boolean;
}) {
  // Deterministic hue per source — softer than category colors
  const hue = Array.from(slug).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const color = `oklch(42% 0.04 ${hue})`;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color }}>
      {withDot && (
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
