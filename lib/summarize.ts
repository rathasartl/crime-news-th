import type { AISummary, CrimeCategory, FetchedItem } from "./types";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MAX_RETRIES = 5;
const RATE_LIMIT_PADDING_MS = 2000;
const MIN_REQUEST_INTERVAL_MS = 12_000;
let lastRequestMs = 0;

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
- ถ้าต้นฉบับเป็นภาษาอังกฤษ/ภาษาอื่น ให้แปลชื่อคน/สถานที่เป็นไทย

คืนค่า JSON ตามรูปแบบนี้เท่านั้น ไม่มี markdown:
{"summary_th": "...", "category": "murder|theft_robbery|fraud_scam|drugs|cybercrime|white_collar|sexual|traffic|other_crime|not_crime", "confidence": 0.0-1.0, "location": "ชื่อจังหวัด/เมือง/ประเทศ หรือ null", "source_language": "th|en|zh|ja|ko|ar|es|fr|de|ru|vi|other", "is_translated": true|false}`;

const VALID: CrimeCategory[] = [
  "murder", "theft_robbery", "fraud_scam", "drugs", "cybercrime",
  "white_collar", "sexual", "traffic", "other_crime", "not_crime"
];

let clientDisabled = false;

function getApiKey(): string | null {
  if (clientDisabled) return null;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.length === 0) {
    console.warn("[summarize] GROQ_API_KEY missing — storing articles without AI summary");
    clientDisabled = true;
    return null;
  }
  return apiKey;
}

export function isAIDisabled(): boolean {
  return process.env.GROQ_API_KEY == null || process.env.GROQ_API_KEY.length === 0;
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message: string };
}

export async function summarize(item: FetchedItem, sourceLanguage?: string): Promise<AISummary> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      summary_th: item.rawExcerpt ?? item.title,
      category: "other_crime",
      confidence: 0,
      location: null,
      source_language: sourceLanguage ?? "th",
      is_translated: false
    };
  }

  const input = buildPromptInput(item);
  const langHint = sourceLanguage && sourceLanguage !== "th"
    ? `\n\nหมายเหตุ: แหล่งข่าวนี้ระบุภาษา = "${sourceLanguage}" (อาจต้องแปล)`
    : "";

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `หัวข้อ: ${item.title}\n\nเนื้อหา:\n${input}${langHint}\n\nคืน JSON:`
      }
    ],
    temperature: 0,
    max_tokens: 500,
    response_format: { type: "json_object" }
  };

  let text = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const waitForSlot = lastRequestMs + MIN_REQUEST_INTERVAL_MS - Date.now();
    if (waitForSlot > 0 && attempt === 0) {
      await new Promise((r) => setTimeout(r, waitForSlot));
    }
    lastRequestMs = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const json = (await res.json()) as GroqResponse;

      if (res.status === 429 || (json.error && json.error.message.includes("rate"))) {
        if (attempt === MAX_RETRIES) {
          throw new Error(`Groq rate limit: ${json.error?.message ?? "429"}`);
        }
        const waitMs = parseRetryMs(json.error?.message) + RATE_LIMIT_PADDING_MS;
        console.warn(`[summarize] 429 rate hit, waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Groq HTTP ${res.status}: ${json.error?.message ?? "unknown"}`);
      }

      text = json.choices?.[0]?.message?.content ?? "";
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (text.length === 0) {
    throw new Error("Groq returned empty response after retries");
  }

  const parsed = JSON.parse(stripCodeFence(text)) as Record<string, unknown>;
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

function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return trimmed;
}

function parseRetryMs(message: string | undefined): number {
  if (!message) return 15_000;
  const m = message.match(/try again in\s+(\d+(?:\.\d+)?)\s*([ms])/i);
  if (!m) return 15_000;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  return Math.max(1_000, unit === "m" ? n * 60_000 : n * 1_000);
}

function buildPromptInput(item: FetchedItem): string {
  const parts: string[] = [];
  if (item.rawExcerpt) parts.push(item.rawExcerpt.slice(0, 600));
  if (item.contentHtml) {
    const stripped = item.contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (stripped.length > 0) parts.push(stripped.slice(0, 800));
  }
  if (parts.length === 0) parts.push(item.title);
  return parts.join("\n\n").slice(0, 1200);
}
