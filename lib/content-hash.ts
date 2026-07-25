import { createHash } from "node:crypto";

const STRIP_HTML = /<[^>]+>/g;
const WHITESPACE = /\s+/g;
const LEAD_WS = /^[\s　]+|[\s　]+$/g;

/**
 * Normalize a title or body fragment for deduplication.
 * - strips HTML
 * - collapses whitespace
 * - lowercases
 * - strips common Thai news title prefixes/suffixes
 */
export function normalizeForHash(input: string): string {
  const stripped = input.replace(STRIP_HTML, " ").replace(WHITESPACE, " ").replace(LEAD_WS, "");
  const lower = stripped.toLowerCase();
  // Strip common prefixes that don't change identity
  return lower
    .replace(/^(ข่าวด่วน|ข่าว|อัปเดต|breaking|เอ็กซ์คลูซีฟ|exclusive)\s*[:：|-–]\s*/i, "")
    .replace(/\s*[|–\-]\s*(ข่าวสด|ประชาชาติ|เดอะสแตนดาร์ด|ไบรท์ทีวี|เอ็นเน็วส์)\s*$/, "");
}

export function hashContent(...parts: string[]): string {
  const combined = parts.map(normalizeForHash).join("|");
  return createHash("sha256").update(combined, "utf8").digest("hex").slice(0, 32);
}
