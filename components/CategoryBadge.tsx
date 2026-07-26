import {
  CATEGORY_COLOR,
  CATEGORY_CSS_VAR,
  CATEGORY_LABEL_TH,
  type CrimeCategory
} from "@/lib/types";

export function CategoryBadge({
  category,
  confidence,
  size = "sm"
}: {
  category: CrimeCategory;
  confidence?: number | null;
  size?: "xs" | "sm" | "md";
}) {
  const label = CATEGORY_LABEL_TH[category];
  const color = CATEGORY_COLOR[category];
  const cssVar = CATEGORY_CSS_VAR[category];
  const dim = confidence != null && confidence < 0.5;

  const sizeCls =
    size === "xs"
      ? "px-1.5 py-0.5 text-[9px]"
      : size === "md"
      ? "px-2.5 py-1 text-[11px]"
      : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider ${sizeCls}`}
      style={
        {
          backgroundColor: `color-mix(in oklch, var(${cssVar}) 12%, white)`,
          color: `color-mix(in oklch, var(${cssVar}) 82%, black)`,
          opacity: dim ? 0.65 : 1
        } as React.CSSProperties
      }
    >
      <span
        aria-hidden
        className="inline-block h-1 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
