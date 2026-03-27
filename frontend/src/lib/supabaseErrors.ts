/** PostgrestError 등은 `instanceof Error`가 아닐 수 있음 */
export function getSupabaseErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return "알 수 없는 오류입니다.";
}

/** parent_interest_tags 컬럼 미적용 등 */
export function hintForMissingInterestColumn(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("parent_interest_tags")) {
    return "Supabase에서 `006_parent_interest_tags.sql` 마이그레이션을 실행했는지 확인해 주세요.";
  }
  if (
    (m.includes("column") && m.includes("does not exist")) ||
    m.includes("undefined column") ||
    m.includes("schema cache")
  ) {
    return "DB 스키마가 최신인지 확인해 주세요. `006_parent_interest_tags.sql`을 Supabase SQL Editor에서 실행하세요.";
  }
  return null;
}
