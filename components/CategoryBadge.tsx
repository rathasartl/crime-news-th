import { CATEGORY_COLOR, CATEGORY_LABEL_TH, type CrimeCategory } from "@/lib/types";

export function CategoryBadge({
  category,
  confidence
}: {
  category: CrimeCategory;
  confidence?: number | null;
}) {
  const label = CATEGORY_LABEL_TH[category];
  const color = CATEGORY_COLOR[category];
  const dim = confidence != null && confidence < 0.5;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `color-mix(in oklch, ${color} 12%, white)`,
        color: `color-mix(in oklch, ${color} 75%, black)`,
        opacity: dim ? 0.65 : 1
      }}
    >
      {label}
    </span>
  );
}
