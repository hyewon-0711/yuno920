-- growth_metrics.memo (002에 포함된 내용 — 초기 스키마만 둔 DB에서 오류 날 때 단독 실행 가능)
-- 오류: Could not find the 'memo' column of 'growth_metrics' in the schema cache
ALTER TABLE public.growth_metrics ADD COLUMN IF NOT EXISTS memo TEXT;
