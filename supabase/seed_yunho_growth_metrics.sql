-- 윤호 성장 스프레드시트 → public.growth_metrics 일괄 입력
-- 1) children 테이블에서 id 확인 후 YOUR_CHILD_ID 교체
-- 2) memo 컬럼 없으면: ALTER TABLE public.growth_metrics ADD COLUMN IF NOT EXISTS memo TEXT;
-- 3) 같은 날짜·같은 아이 중복이 있으면 먼저 DELETE 하거나 이 스크립트는 한 번만 실행

-- SELECT id, name, birth_date FROM public.children WHERE name ILIKE '%윤호%';

INSERT INTO public.growth_metrics (child_id, height, weight, recorded_at, memo)
VALUES
  -- 아래 행은 시트상 2015-11-29인데 출생(2018-09)보다 이전이면 날짜 오타일 수 있음
  ('YOUR_CHILD_ID'::uuid, 125.0, 25.7, '2015-11-29', NULL),
  ('YOUR_CHILD_ID'::uuid,  51.0,  3.1, '2018-09-20', '40주 4일'),
  ('YOUR_CHILD_ID'::uuid, 117.0, 22.8, '2024-09-07', NULL),
  ('YOUR_CHILD_ID'::uuid, 117.9, 21.0, '2024-10-19', NULL),
  ('YOUR_CHILD_ID'::uuid, 118.4, 24.0, '2024-11-09', NULL),
  ('YOUR_CHILD_ID'::uuid, 120.6, 26.0, '2025-01-01', NULL),
  ('YOUR_CHILD_ID'::uuid, 120.0, 26.7, '2025-02-08', NULL),
  ('YOUR_CHILD_ID'::uuid, 121.0, 26.2, '2025-03-15', NULL),
  ('YOUR_CHILD_ID'::uuid, 122.3, 25.2, '2025-05-06', NULL),
  ('YOUR_CHILD_ID'::uuid, 123.2, 25.3, '2025-06-21', NULL),
  ('YOUR_CHILD_ID'::uuid, 123.1, 24.6, '2025-07-05', NULL),
  ('YOUR_CHILD_ID'::uuid, 122.1, 23.0, '2025-07-19', NULL),
  ('YOUR_CHILD_ID'::uuid, 124.0, 25.0, '2025-11-01', NULL),
  ('YOUR_CHILD_ID'::uuid, 126.0, 27.9, '2026-02-14', '성장클리닉'),
  ('YOUR_CHILD_ID'::uuid, 126.3, 28.2, '2026-03-01', '황금손');
