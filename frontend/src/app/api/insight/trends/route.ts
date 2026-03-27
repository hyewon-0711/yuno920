import { NextRequest, NextResponse } from "next/server";
import { interestMeta, isParentInterestId, type ParentInterestId } from "@/lib/parentInterests";

export const dynamic = "force-dynamic";

const PER_TAG = 4;
const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripCdata(s: string): string {
  return s
    .trim()
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function parseRssItems(xml: string): { title: string; link: string; pubDate?: string }[] {
  const items: { title: string; link: string; pubDate?: string }[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const t = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const l = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const p = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    if (!t?.[1] || !l?.[1]) continue;
    const title = decodeXmlEntities(stripCdata(t[1].replace(/<[^>]+>/g, "")));
    const link = stripCdata(l[1].replace(/<[^>]+>/g, "")).trim();
    const pubDate = p?.[1] ? stripCdata(p[1].replace(/<[^>]+>/g, "")).trim() : undefined;
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

async function fetchNewsForQuery(query: string): Promise<{ title: string; link: string; pubDate?: string }[]> {
  const q = encodeURIComponent(`${query}`);
  const url = `${GOOGLE_NEWS_RSS}?q=${q}&hl=ko&gl=KR&ceid=KR:ko`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Yuno920Insight/1.0" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseRssItems(xml).slice(0, PER_TAG);
}

function parseTagsParam(searchParams: URLSearchParams): ParentInterestId[] {
  const raw = searchParams.get("tags");
  if (!raw) return [];
  const parts = raw.split(",").map((s) => s.trim().toLowerCase());
  const out: ParentInterestId[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (!p || seen.has(p) || out.length >= 6) break;
    if (!isParentInterestId(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

export async function GET(req: NextRequest) {
  const tags = parseTagsParam(req.nextUrl.searchParams);
  if (tags.length === 0) {
    return NextResponse.json({ fetchedAt: new Date().toISOString(), groups: [] });
  }

  const results = await Promise.all(
    tags.map(async (id) => {
      const meta = interestMeta(id);
      try {
        const items = await fetchNewsForQuery(meta.query);
        return { id, label: meta.label, hashtag: meta.hashtag, items };
      } catch {
        return { id, label: meta.label, hashtag: meta.hashtag, items: [] as { title: string; link: string; pubDate?: string }[] };
      }
    }),
  );

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    groups: results,
  });
}
