import type { CrimeCategory } from "./types";

export interface CategoryMeta {
  slug: CrimeCategory;
  label_th: string;
  label_en: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const CATEGORY_META: Record<CrimeCategory, CategoryMeta> = {
  murder: {
    slug: "murder",
    label_th: "ฆาตกรรม",
    label_en: "Murder & Assault",
    icon: "🔪",
    description: "ฆาตกรรม พยายามฆ่า ทำร้ายร่างกายรุนแรง มีอาวุธ",
    keywords: ["ฆ่า", "แทง", "ยิง", "ตบตี", "ทำร้าย", "ตาย", "เสียชีวิต"]
  },
  theft_robbery: {
    slug: "theft_robbery",
    label_th: "ลักทรัพย์ / ปล้น",
    label_en: "Theft & Robbery",
    icon: "💵",
    description: "ลักทรัพย์ ปล้น ฉุดทรัพย์ รีดไถ บุกเข้าบ้าน",
    keywords: ["ปล้น", "ลัก", "ฉก", "ฉุด", "รีดไถ", "ขโมย"]
  },
  fraud_scam: {
    slug: "fraud_scam",
    label_th: "ฉ้อโกง / สแกม",
    label_en: "Fraud & Scam",
    icon: "🎭",
    description: "ฉ้อโกง คอลสแกม ปลอมแปลง เช็คเด้ง ลงทุนหลอก",
    keywords: ["โกง", "สแกม", " call center", "ลงทุน", "ปลอม", "เช็คเด้ง"]
  },
  drugs: {
    slug: "drugs",
    label_th: "ยาเสพติด",
    label_en: "Drugs",
    icon: "💊",
    description: "ค้ายา ขายยา เสพยา กัญชา น้ำแข็ง ยาบ้า",
    keywords: ["ยาบ้า", "น้ำแข็ง", "กัญชา", "เฮโรอีน", "ค้ายา", "เสพ"]
  },
  cybercrime: {
    slug: "cybercrime",
    label_th: "ไซเบอร์อาชญากรรม",
    label_en: "Cybercrime",
    icon: "💻",
    description: "แฮก ขโมยข้อมูล มัลแวร์ ฟิชชิ่ง ค้าสินค้าผิดกฎหมายออนไลน์",
    keywords: ["แฮก", "ข้อมูล", "ฟิชชิ่ง", "มัลแวร์", "ออนไลน์"]
  },
  white_collar: {
    slug: "white_collar",
    label_th: "ทุจริต / ฟอกเงิน",
    label_en: "White Collar",
    icon: "💼",
    description: "ทุจริต ฟอกเงิน ยักยอก หนีภาษี อาชญากรรมผู้ทุน",
    keywords: ["ทุจริต", "ฟอกเงิน", "ยักยอก", "ภาษี", "สินบน"]
  },
  sexual: {
    slug: "sexual",
    label_th: "คุกคามทางเพศ",
    label_en: "Sexual Offenses",
    icon: "🚨",
    description: "คุกคามทางเพศ ล่วงละเมิด ค้ามนุษย์เพื่อประเวศี",
    keywords: ["ข่มขืน", "ล่วงละเมิด", "ค้ามนุษย์", "ประเวศี", "คุกคาม"]
  },
  traffic: {
    slug: "traffic",
    label_th: "อุบัติเหตุรุนแรง",
    label_en: "Traffic & Vehicular",
    icon: "🚗",
    description: "อุบัติเหตุรุนแรง ขับรถชนแล้วหนี แข่งรถ เมาแล้วขับ",
    keywords: ["ชน", "อุบัติเหตุ", "เมา", "แข่งรถ", "หนีตำรวจ"]
  },
  other_crime: {
    slug: "other_crime",
    label_th: "อาชญากรรมอื่น ๆ",
    label_en: "Other Crime",
    icon: "⚖️",
    description: "ผิดกฎหมายอาวุธ การพนัน บุกรุก เผาทำลาย คดีอาญาทั่วไป",
    keywords: ["ปืน", "อาวุธ", "พนัน", "บุกรุก", "วัตถุระเบิด"]
  },
  not_crime: {
    slug: "not_crime",
    label_th: "ไม่ใช่อาชญากรรม",
    label_en: "Not Crime",
    icon: "📰",
    description: "ข่าวที่ AI ตัดสินว่าไม่ใช่อาชญากรรม (การเมือง เศรษฐกิจ บันเทิง)",
    keywords: []
  }
};

export const BROWSABLE_CATEGORIES: CategoryMeta[] = [
  CATEGORY_META.murder,
  CATEGORY_META.theft_robbery,
  CATEGORY_META.fraud_scam,
  CATEGORY_META.drugs,
  CATEGORY_META.cybercrime,
  CATEGORY_META.white_collar,
  CATEGORY_META.sexual,
  CATEGORY_META.traffic,
  CATEGORY_META.other_crime
];
