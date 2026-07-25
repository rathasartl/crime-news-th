export function SourceBadge({ slug, name }: { slug: string; name: string }) {
  // Color is derived deterministically from slug so each source looks distinct
  const hue = Array.from(slug).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const color = `oklch(45% 0.05 ${hue})`;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium"
      style={{ color }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {name}
    </span>
  );
}
