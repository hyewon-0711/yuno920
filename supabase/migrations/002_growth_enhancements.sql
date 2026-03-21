-- Sprint 3: Growth enhancements
-- growth_metrics: memo 추가
ALTER TABLE public.growth_metrics ADD COLUMN IF NOT EXISTS memo TEXT;

-- reading_logs: author, rating 추가 (프론트 호환)
ALTER TABLE public.reading_logs ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE public.reading_logs ADD COLUMN IF NOT EXISTS rating INT;

-- hexagon_scores: 사용자 직접 입력 허용 (INSERT, UPDATE)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hexagon_scores' AND policyname = 'hexagon_scores_insert') THEN
    CREATE POLICY "hexagon_scores_insert" ON public.hexagon_scores FOR INSERT WITH CHECK (public.has_child_write_access(child_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hexagon_scores' AND policyname = 'hexagon_scores_update') THEN
    CREATE POLICY "hexagon_scores_update" ON public.hexagon_scores FOR UPDATE USING (public.has_child_write_access(child_id));
  END IF;
END $$;
