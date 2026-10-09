-- Daily mission MVP: curated age-appropriate activities assigned per child and day.
-- Apply manually in the Supabase SQL Editor after 014_web_push_subscriptions.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.mission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE CHECK (char_length(trim(title)) > 0),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0),
  area TEXT NOT NULL CHECK (area IN ('learning', 'physical', 'creative', 'social', 'habit')),
  estimated_minutes INTEGER NOT NULL DEFAULT 10 CHECK (estimated_minutes BETWEEN 3 AND 60),
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium')),
  is_bonus BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 4),
  template_id UUID REFERENCES public.mission_templates(id) ON DELETE SET NULL,
  title_snapshot TEXT NOT NULL,
  description_snapshot TEXT NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('learning', 'physical', 'creative', 'social', 'habit')),
  estimated_minutes INTEGER NOT NULL DEFAULT 10 CHECK (estimated_minutes BETWEEN 3 AND 60),
  is_bonus BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
  points INTEGER NOT NULL DEFAULT 10 CHECK (points BETWEEN 1 AND 100),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completion_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, mission_date, slot)
);

CREATE INDEX IF NOT EXISTS daily_missions_child_date
  ON public.daily_missions(child_id, mission_date DESC, slot);

INSERT INTO public.mission_templates (title, description, area, estimated_minutes, difficulty, is_bonus)
VALUES
  ('오늘의 이야기 세 가지', '오늘 있었던 일을 세 가지 떠올려 차례대로 이야기해보세요.', 'learning', 10, 'easy', false),
  ('그림책 한 장면 다시 말하기', '그림책을 읽고 가장 기억에 남은 장면을 아이의 말로 설명해보세요.', 'learning', 15, 'easy', false),
  ('주변에서 같은 모양 찾기', '집 안에서 동그라미, 세모, 네모 모양을 각각 하나씩 찾아보세요.', 'learning', 10, 'easy', true),
  ('몸을 크게 움직이기', '음악 한 곡을 틀고 아이와 자유롭게 춤추거나 스트레칭해보세요.', 'physical', 10, 'easy', false),
  ('공 주고받기', '가까운 거리에서 아이와 공을 천천히 다섯 번 주고받아보세요.', 'physical', 10, 'easy', false),
  ('색깔 산책', '산책하며 오늘의 색깔 하나를 정하고 그 색을 세 군데 찾아보세요.', 'physical', 20, 'easy', true),
  ('오늘의 상상 그림', '“구름 위에 집이 있다면?”을 주제로 자유롭게 그림을 그려보세요.', 'creative', 15, 'easy', false),
  ('집 안 재료로 만들기', '종이컵, 휴지심처럼 주변 재료로 새로운 작품을 만들어보세요.', 'creative', 20, 'medium', false),
  ('소리 악기 만들기', '통이나 상자에 안전한 재료를 넣어 흔들어 소리를 비교해보세요.', 'creative', 15, 'easy', true),
  ('고마웠던 일 말하기', '서로에게 오늘 고마웠던 일을 한 가지씩 말해주세요.', 'social', 5, 'easy', false),
  ('아이의 선택 존중하기', '간식이나 놀이처럼 작은 선택 하나를 아이가 직접 고르게 해보세요.', 'social', 5, 'easy', false),
  ('칭찬 릴레이', '아이의 노력이나 과정을 발견해 구체적으로 한 번 칭찬해주세요.', 'social', 5, 'easy', true),
  ('장난감 세 개 정리하기', '놀이가 끝난 뒤 장난감 세 개를 아이와 함께 제자리에 놓아보세요.', 'habit', 5, 'easy', false),
  ('물 마시고 몸 살피기', '물을 한 컵 마시고 지금 몸이 어떤 느낌인지 함께 말해보세요.', 'habit', 5, 'easy', false),
  ('내일 준비 한 가지', '내일 필요한 물건 하나를 아이와 함께 미리 준비해보세요.', 'habit', 10, 'easy', true)
ON CONFLICT (title) DO NOTHING;

ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mission_templates_select_approved ON public.mission_templates;
CREATE POLICY mission_templates_select_approved
  ON public.mission_templates FOR SELECT TO authenticated
  USING ((SELECT public.is_approved_member()) AND active = true);

DROP POLICY IF EXISTS daily_missions_select ON public.daily_missions;
CREATE POLICY daily_missions_select
  ON public.daily_missions FOR SELECT TO authenticated
  USING (public.has_child_access(child_id));

DROP POLICY IF EXISTS daily_missions_insert ON public.daily_missions;
CREATE POLICY daily_missions_insert
  ON public.daily_missions FOR INSERT TO authenticated
  WITH CHECK (public.has_child_write_access(child_id));

DROP POLICY IF EXISTS daily_missions_update ON public.daily_missions;
CREATE POLICY daily_missions_update
  ON public.daily_missions FOR UPDATE TO authenticated
  USING (public.has_child_write_access(child_id))
  WITH CHECK (public.has_child_write_access(child_id));

DROP POLICY IF EXISTS daily_missions_delete ON public.daily_missions;
CREATE POLICY daily_missions_delete
  ON public.daily_missions FOR DELETE TO authenticated
  USING (public.has_child_write_access(child_id));

DROP TRIGGER IF EXISTS set_daily_missions_updated_at ON public.daily_missions;
CREATE TRIGGER set_daily_missions_updated_at
  BEFORE UPDATE ON public.daily_missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

GRANT SELECT ON public.mission_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_missions TO authenticated;
GRANT ALL ON public.mission_templates, public.daily_missions TO service_role;

COMMIT;
