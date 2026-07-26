export type CrimeCategory =
  | "murder"
  | "theft_robbery"
  | "fraud_scam"
  | "drugs"
  | "cybercrime"
  | "white_collar"
  | "sexual"
  | "traffic"
  | "other_crime"
  | "not_crime";

export const CATEGORY_ORDER: CrimeCategory[] = [
  "murder",
  "theft_robbery",
  "fraud_scam",
  "drugs",
  "cybercrime",
  "white_collar",
  "sexual",
  "traffic",
  "other_crime",
  "not_crime"
];

export const CATEGORY_LABEL_TH: Record<CrimeCategory, string> = {
  murder: "ฆาตกรรม",
  theft_robbery: "ลักทรัพย์/ปล้น",
  fraud_scam: "ฉ้อโกง/สแกม",
  drugs: "ยาเสพติด",
  cybercrime: "ไซเบอร์",
  white_collar: "ทุจริต",
  sexual: "คุกคาม",
  traffic: "อุบัติเหตุ",
  other_crime: "อาชญากรรมอื่น",
  not_crime: "ไม่ใช่อาชญากรรม"
};

export const CATEGORY_COLOR: Record<CrimeCategory, string> = {
  murder: "var(--color-cat-murder)",
  theft_robbery: "var(--color-cat-theft)",
  fraud_scam: "var(--color-cat-fraud)",
  drugs: "var(--color-cat-drugs)",
  cybercrime: "var(--color-cat-cyber)",
  white_collar: "var(--color-cat-collar)",
  sexual: "var(--color-cat-sexual)",
  traffic: "var(--color-cat-traffic)",
  other_crime: "var(--color-cat-other)",
  not_crime: "var(--color-cat-none)"
};

export const CATEGORY_CSS_VAR: Record<CrimeCategory, string> = {
  murder: "--color-cat-murder",
  theft_robbery: "--color-cat-theft",
  fraud_scam: "--color-cat-fraud",
  drugs: "--color-cat-drugs",
  cybercrime: "--color-cat-cyber",
  white_collar: "--color-cat-collar",
  sexual: "--color-cat-sexual",
  traffic: "--color-cat-traffic",
  other_crime: "--color-cat-other",
  not_crime: "--color-cat-none"
};

export interface Source {
  id: string;
  slug: string;
  name: string;
  feed_url: string;
  site_url: string | null;
  language: string;       // 'th' | 'en' | ...
  country: string;        // ISO-2: 'TH', 'US', 'GB', ...
  emoji: string | null;   // flag emoji
  is_active: boolean;
}

export interface Article {
  id: string;
  source_id: string;
  url: string;
  title: string;
  raw_excerpt: string | null;
  content_html: string | null;
  image_url: string | null;
  published_at: string;
  summary_th: string | null;
  category: CrimeCategory | null;
  confidence: number | null;
  location: string | null;
  source_language: string;    // 'th' | 'en' | ...
  is_translated: boolean;
  click_count: number;
  hidden: boolean;

  // joined
  source?: Pick<Source, "slug" | "name" | "language" | "country" | "emoji">;
}

export interface FetchedItem {
  title: string;
  url: string;
  publishedAt: Date;
  rawExcerpt: string | null;
  contentHtml: string | null;
  imageUrl: string | null;
  externalId: string | null;
}

export interface AISummary {
  summary_th: string;
  category: CrimeCategory;
  confidence: number;
  location: string | null;
  source_language: string;   // detected by AI: 'th' | 'en' | 'mixed' | ...
  is_translated: boolean;
}
