-- records 제목 컬럼 추가 + 긴 본문 저장 보장
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS title TEXT;

-- 기존 환경에서 content가 varchar일 수 있어 TEXT로 통일
ALTER TABLE public.records
  ALTER COLUMN content TYPE TEXT;
