/** 이메일 가입 직후 온보딩으로 넘길 때 사용 */
export const PENDING_PARENT_INTERESTS_KEY = "yuno_pending_parent_interests";

export const PARENT_INTEREST_OPTIONS = [
  { id: "travel", label: "여행 정보", hashtag: "#여행정보", query: "여행" },
  { id: "ai", label: "AI 정보", hashtag: "#AI정보", query: "인공지능 AI" },
  { id: "stocks", label: "주식 시장", hashtag: "#주식시장", query: "주식 시장" },
  { id: "realestate", label: "부동산 시장", hashtag: "#부동산시장", query: "부동산 시장" },
  { id: "economy", label: "경제 뉴스", hashtag: "#경제", query: "경제 뉴스" },
  { id: "health", label: "건강 · 웰빙", hashtag: "#건강", query: "건강 웰빙" },
] as const;

export type ParentInterestId = (typeof PARENT_INTEREST_OPTIONS)[number]["id"];

const ALLOWED = new Set<string>(PARENT_INTEREST_OPTIONS.map((o) => o.id));

export function isParentInterestId(v: string): v is ParentInterestId {
  return ALLOWED.has(v);
}

export function normalizeInterestIds(raw:(string | null | undefined)[]): ParentInterestId[] {
  const out: ParentInterestId[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (!x || typeof x !== "string") continue;
    if (!isParentInterestId(x) || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

export function interestMeta(id: ParentInterestId) {
  return PARENT_INTEREST_OPTIONS.find((o) => o.id === id)!;
}
