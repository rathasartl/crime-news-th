import { GoogleGenAI, Type } from "@google/genai";
import type { AISummary, CrimeCategory, FetchedItem } from "./types";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SYSTEM_PROMPT = `คุณเป็นบรรณาธิการข่าวอาชญากรรมในไทย หน้าที่ของคุณ:
1. อ่านบทความที่ส่งให้ (อาจเป็นภาษาไทยหรือภาษาอื่น ๆ)
2. สรุปให้สั้น 2-3 ประโยค เป็นภาษาไทยเสมอ — ถ้าต้นฉบับไม่ใช่ภาษาไทย ต้องแปลเป็นไทย
3. จัดหมวดหมู่อาชญากรรมให้ถูกต้อง
4. ถ้าไม่ใช่ข่าวอาชญากรรม ให้ตั้ง category = "not_crime"
5. ตรวจหาภาษาต้นฉบับ — ถ้าไม่ใช่ภาษาไทย ให้ตั้ง is_translated=true

หมวดหมู่ที่ใช้ได้:
- murder          ฆาตกรรม/พยายามฆ่า/ทำร้ายร่างกายรุนแรง
- theft_robbery   ลักทรัพย์/ปล้น/ฉุดทรัพย์/รีดไถ
- fraud_scam      ฉ้อโกง/สแกม/ปลอมแปลง/เช็คเด้ง
- drugs           ยาเสพติด/ขายยา/เสพยา
- cybercrime      ไซเบอร์/แฮก/ขโมยข้อมูล/มัลแวร์
- white_collar    ทุจริต/ฟอกเงิน/อาชญากรรมผู้ทุน/ยักยอก
- sexual          คุกคาม/รุนแรงทางเพศ/ค้ามนุษย์เพื่อประเวศี
- traffic         อุบัติเหตุรุนแรง/ขับรถชนแล้วหนี/แข่งรถ
- other_crime     อาชญากรรมอื่น ๆ (ผิดกฎหมายอาวุธ, การพนัน, บุกรุก)
- not_crime       ไม่ใช่ข่าวอาชญากรรม (การเมือง, กีฬา, บันเทิง, ไลฟ์สไตล์, ข่าวเศรษฐกิจทั่วไป)

กฎการสรุป:
- ประโยคแรกคือ "เกิดอะไรที่ไหน" — กระชับ
- ประโยคสองคือ "ใครทำอะไร" — ถ้ามีผู้ต้องหา/ผู้เสียหาย
- ห้ามใส่ความคิดเห็นส่วนตัว ห้ามใส่อารมณ์
- ห้ามสรุปแบบ "ข่าวล่าสุด!" "อัปเดต!" ให้ข้อมูลตรง ๆ
- ความยาวไม่เกิน 80 คำ
- ถ้าต้นฉบับเป็นภาษาอังกฤษ/ภาษาอื่น ให้แปลชื่อคน/สถานที่เป็นไทย (เช่น "Washington" → "วอชิงตัน", "Trump" → "ทรัมป์")`;

const VALID: CrimeCategory[] = [
  "murder", "theft_robbery", "fraud_scam", "drugs", "cybercrime",
  "white_collar", "sexual", "traffic", "other_crime", "not_crime"
];

let client: GoogleGenAI | null = null;
let clientDisabled = false;

function getClient(): GoogleGenAI | null {
  if (clientDisabled) return null;
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length === 0) {
    console.warn("[summarize] GEMINI_API_KEY missing — storing articles without AI summary");
    clientDisabled = true;
    return null;
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

export function isAIDisabled(): boolean {
  return process.env.GEMINI_API_KEY == null || process.env.GEMINI_API_KEY.length === 0;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary_th: { type: Type.STRING },
    category: {
      type: Type.STRING,
      enum: VALID
    },
    confidence: { type: Type.NUMBER },
    location: { type: Type.STRING, nullable: true },
    source_language: {
      type: Type.STRING,
      enum: ["th", "en", "zh", "ja", "ko", "ar", "es", "fr", "de", "ru", "vi", "other"]
    },
    is_translated: { type: Type.BOOLEAN }
  },
  required: ["summary_th", "category", "confidence", "source_language", "is_translated"]
};

export async function summarize(item: FetchedItem, sourceLanguage?: string): Promise<AISummary> {
  const input = buildPromptInput(item);
  const ai = getClient();

  if (!ai) {
    return {
      summary_th: item.rawExcerpt ?? item.title,
      category: "other_crime",
      confidence: 0,
      location: null,
      source_language: sourceLanguage ?? "th",
      is_translated: false
    };
  }

  const langHint = sourceLanguage && sourceLanguage !== "th"
    ? `\n\nหมายเหตุ: แหล่งข่าวนี้ระบุภาษา = "${sourceLanguage}" (อาจต้องแปล)`
    : "";

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `หัวข้อ: ${item.title}\n\nเนื้อหา:\n${input}${langHint}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0,
      maxOutputTokens: 400,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  const text = response.text ?? "";
  if (text.length === 0) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(text) as Record<string, unknown>;
  const rawCategory = typeof parsed.category === "string" ? parsed.category : "";
  const category: CrimeCategory = VALID.includes(rawCategory as CrimeCategory)
    ? (rawCategory as CrimeCategory)
    : "other_crime";
  const confidence =
    typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;
  const summaryThRaw = typeof parsed.summary_th === "string" ? parsed.summary_th.trim() : "";
  const summary_th = summaryThRaw.length > 0 ? summaryThRaw : item.rawExcerpt ?? item.title;
  const locationRaw = typeof parsed.location === "string" ? parsed.location.trim() : "";
  const location =
    locationRaw.length > 0 && locationRaw.toLowerCase() !== "null" ? locationRaw : null;

  const detectedLang = typeof parsed.source_language === "string"
    ? parsed.source_language.toLowerCase().trim()
    : (sourceLanguage ?? "th");
  const isTranslated =
    typeof parsed.is_translated === "boolean"
      ? parsed.is_translated
      : detectedLang !== "th";

  return {
    summary_th,
    category,
    confidence,
    location,
    source_language: detectedLang,
    is_translated: isTranslated
  };
}

function buildPromptInput(item: FetchedItem): string {
  const parts: string[] = [];
  if (item.rawExcerpt) parts.push(item.rawExcerpt);
  if (item.contentHtml) {
    const stripped = item.contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (stripped.length > 0) parts.push(stripped.slice(0, 1800));
  }
  if (parts.length === 0) parts.push(item.title);
  return parts.join("\n\n").slice(0, 2200);
}
