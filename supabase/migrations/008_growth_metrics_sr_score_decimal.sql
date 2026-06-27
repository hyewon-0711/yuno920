-- SR 점수를 소수점(예: 4.5)으로 저장 가능하도록 타입 변경
ALTER TABLE public.growth_metrics
  ALTER COLUMN sr_score TYPE NUMERIC(4,1) USING sr_score::numeric;

ALTER TABLE public.growth_metrics
  DROP CONSTRAINT IF EXISTS growth_metrics_sr_score_check;

ALTER TABLE public.growth_metrics
  ADD CONSTRAINT growth_metrics_sr_score_check
  CHECK (sr_score BETWEEN 0 AND 100);
