export function timeAgoTh(dateInput: string | Date, now: Date = new Date()): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diff = Math.max(0, now.getTime() - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 30) return "เมื่อสักครู่";
  if (s < 60) return `${s} วินาทีที่แล้ว`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  // Switch to absolute date
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
