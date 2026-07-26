import { XMLParser } from "fast-xml-parser";
import type { FetchedItem } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  trimValues: true,
  parseAttributeValue: false,
  numberParseOptions: { leadingZeros: false, hex: false, skipLike: /\d+/ }
});

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  nbsp: " ", mdash: "—", ndash: "–", hellip: "…",
  lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”"
};

const ENTITY_RE = /&(?:#x([0-9a-fA-F]+)|#([0-9]+)|([a-zA-Z]+));/g;
export function decodeEntities(s: string): string {
  return s.replace(ENTITY_RE, (m, hex, dec, name) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (dec) return String.fromCodePoint(parseInt(dec, 10));
    return NAMED_ENTITIES[name] ?? m;
  });
}

const USER_AGENT =
  "crime-news-th/0.1 (+https://github.com/local/crime-news-th; RSS reader; Bun/1.x)";

export async function fetchFeed(url: string): Promise<FetchedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/rss+xml, application/xml, text/xml, application/atom+xml;q=0.9, */*;q=0.5"
      },
      signal: controller.signal,
      redirect: "follow"
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  }

  const xml = await res.text();
  return parseFeed(xml, url);
}

export async function fetchFeedPaged(
  baseUrl: string,
  pages: number,
  onPage?: (page: number, count: number) => void
): Promise<FetchedItem[]> {
  const all: FetchedItem[] = [];
  for (let page = 1; page <= pages; page++) {
    const url = appendPageParam(baseUrl, page);
    try {
      const items = await fetchFeed(url);
      onPage?.(page, items.length);
      all.push(...items);
      if (items.length === 0) break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[fetch-rss] page ${page} of ${url} failed: ${msg}`);
      break;
    }
  }
  return all;
}

function appendPageParam(url: string, page: number): string {
  if (page === 1) return url;
  const u = new URL(url);
  if (!u.search) return `${url}?paged=${page}`;
  u.searchParams.set("paged", String(page));
  return u.toString();
}

function pickFirstImage(item: any, channelBaseUrl?: string): string | null {
  const candidates = [
    item?.["media:content"]?.["@_url"],
    item?.["media:thumbnail"]?.["@_url"],
    item?.enclosure?.["@_url"],
    ...(Array.isArray(item?.["media:content"]) ? item["media:content"].map((m: any) => m?.["@_url"]) : []),
    extractFirstImg(item?.["content:encoded"]),
    extractFirstImg(item?.description)
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
    if (typeof c === "string" && c.startsWith("/") && channelBaseUrl) return channelBaseUrl + c;
  }
  return null;
}

const IMG_RE = /<img[^>]+src=["']([^"']+)["']/i;
function extractFirstImg(html: unknown): string | null {
  if (typeof html !== "string") return null;
  const m = html.match(IMG_RE);
  return m ? m[1] : null;
}

const TAG_RE = /<[^>]+>/g;
function stripHtml(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const stripped = decodeEntities(s.replace(TAG_RE, " ").replace(/\s+/g, " ")).trim();
  return stripped.length > 0 ? stripped : null;
}

function asArray<T>(x: T | T[] | undefined): T[] {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

function parseDate(value: unknown): Date {
  if (typeof value !== "string" || value.length === 0) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function deriveChannelBaseUrl(channel: any): string | undefined {
  const link = channel?.link;
  if (typeof link === "string" && /^https?:\/\//.test(link)) {
    try {
      return new URL(link).origin;
    } catch {}
  }
  const altLink = channel?.["atom:link"]?.["@_href"];
  if (typeof altLink === "string") {
    try {
      return new URL(altLink).origin;
    } catch {}
  }
  return undefined;
}

export function parseFeed(xml: string, sourceUrl?: string): FetchedItem[] {
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) {
    throw new Error(`No rss/channel or feed element in ${sourceUrl ?? "(unknown)"}`);
  }

  const channelBaseUrl = deriveChannelBaseUrl(channel);
  const rawItems = asArray(channel.item ?? channel.entry);

  const items: FetchedItem[] = [];
  for (const item of rawItems) {
    const title = stripHtml(item.title);
    const link = item.link?.["@_href"] ?? item.link ?? item.guid;
    if (typeof title !== "string" || typeof link !== "string" || title.length === 0 || link.length === 0) {
      continue;
    }
    const url = link.startsWith("http") ? link : channelBaseUrl ? channelBaseUrl + link : link;
    const cleanTitle = decodeEntities(title);

    items.push({
      title: cleanTitle,
      url,
      publishedAt: parseDate(item.pubDate ?? item.published ?? item.updated),
      rawExcerpt: stripHtml(item.description ?? item.summary),
      contentHtml: typeof item["content:encoded"] === "string" ? item["content:encoded"] : null,
      imageUrl: pickFirstImage(item, channelBaseUrl),
      externalId: typeof item.guid === "string" ? item.guid : null
    });
  }
  return items;
}
