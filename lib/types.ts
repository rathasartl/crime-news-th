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
  murder: "oklch(58% 0.22 27)",
  theft_robbery: "oklch(62% 0.18 50)",
  fraud_scam: "oklch(65% 0.16 80)",
  drugs: "oklch(60% 0.18 145)",
  cybercrime: "oklch(60% 0.18 250)",
  white_collar: "oklch(55% 0.12 290)",
  sexual: "oklch(60% 0.20 340)",
  traffic: "oklch(62% 0.14 200)",
  other_crime: "oklch(50% 0.02 250)",
  not_crime: "oklch(75% 0.01 250)"
};

export interface Source {
  id: string;
  slug: string;
  name: string;
  feed_url: string;
  site_url: string | null;
  language: string;
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
  click_count: number;
  hidden: boolean;

  // joined
  source?: Pick<Source, "slug" | "name">;
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
}
