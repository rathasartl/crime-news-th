import Anthropic from "@anthropic-ai/sdk";
import type { AISummary, CrimeCategory, FetchedItem } from "./types";

const MODEL = process.env.SUMMARY_MODEL ?? "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `คุณเป็นบรรณาธิการข่าวอาชญากรรมในไทย หน้าที่ของคุณ:
1. อ่านบทความที่ส่งให้ (อาจเป็นภาษาไทยหรืออังกฤษ)
2. สรุปให้สั้น 2-3 ประโยค เป็นภาษาไทยเสมอ ถ้าเป็นข่าวต่างประเทศให้แปลเป็นไทย
3. จัดหมวดหมู่อาชญากรรมให้ถูกต้อง
4. ถ้าไม่ใช่ข่าวอาชญากรรม ให้ตั้ง category = "not_crime"

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

คืนค่า JSON ตามรูปแบบนี้เท่านั้น ไม่มี markdown:
{"summary_th": "...", "category": "murder|theft_robbery|fraud_scam|drugs|cybercrime|white_collar|sexual|traffic|other_crime|not_crime", "confidence": 0.0-1.0, "location": "ชื่อจังหวัด/เข็ต/หรือ null"}`;

let client: Anthropic | null = null;
let clientDisabled = false;

function getClient(): Anthropic | null {
  if (clientDisabled) return null;
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length === 0) {
    console.warn("[summarize] ANTHROPIC_API_KEY missing — storing articles without AI summary");
    clientDisabled = true;
    return null;
  }
  client = new Anthropic({ apiKey });
  return client;
}

export function isAIDisabled(): boolean {
  return process.env.ANTHROPIC_API_KEY == null || process.env.ANTHROPIC_API_KEY.length === 0;
}

const VALID: CrimeCategory[] = [
  "murder", "theft_robbery", "fraud_scam", "drugs", "cybercrime",
  "white_collar", "sexual", "traffic", "other_crime", "not_crime"
];

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Strip ```json fences if model added them despite instructions
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : trimmed;
  // Find the first { ... } block
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function summarize(item: FetchedItem): Promise<AISummary> {
  const input = buildPromptInput(item);
  const anthropic = getClient();

  // Graceful degradation: no API key → store without summary
  if (!anthropic) {
    return {
      summary_th: item.rawExcerpt ?? item.title,
      category: "other_crime",
      confidence: 0,
      location: null
    };
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 220,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }
      }
    ],
    messages: [
      {
        role: "user",
        content: `หัวข้อ: ${item.title}\n\nเนื้อหา:\n${input}\n\nคืน JSON:`
      }
    ],
    temperature: 0
  });

  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");

  const parsed = extractJson(text) as Record<string, unknown>;
  const rawCategory = typeof parsed.category === "string" ? parsed.category : "";
  const category = VALID.includes(rawCategory as CrimeCategory)
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

  return { summary_th, category, confidence, location };
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
