-- 부모 관심사 태그 (Insight 맞춤 뉴스 등)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS parent_interest_tags TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.users.parent_interest_tags IS '관심 주제 키 배열 (예: travel, ai, stocks, realestate)';
