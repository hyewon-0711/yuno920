-- 주간 고정 시간표 (요일 + 시간 범위 + 카테고리 색)
-- Supabase SQL Editor에서 002 이후 순서로 실행

CREATE TABLE public.weekly_timetable (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'other',
  -- school | afterschool | care | academy | activity | other
  notes        TEXT,
  color        TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weekly_timetable_time_ok CHECK (end_time > start_time)
);

CREATE INDEX idx_weekly_timetable_child_day ON public.weekly_timetable(child_id, day_of_week, start_time);

COMMENT ON TABLE public.weekly_timetable IS '아이별 주간 반복 시간표 (대시보드 고정 표)';

CREATE OR REPLACE FUNCTION public.touch_weekly_timetable()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_timetable_updated
  BEFORE UPDATE ON public.weekly_timetable
  FOR EACH ROW EXECUTE FUNCTION public.touch_weekly_timetable();

ALTER TABLE public.weekly_timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_timetable_select" ON public.weekly_timetable
  FOR SELECT USING (public.has_child_access(child_id));

CREATE POLICY "weekly_timetable_insert" ON public.weekly_timetable
  FOR INSERT WITH CHECK (public.has_child_write_access(child_id));

CREATE POLICY "weekly_timetable_update" ON public.weekly_timetable
  FOR UPDATE USING (public.has_child_write_access(child_id));

CREATE POLICY "weekly_timetable_delete" ON public.weekly_timetable
  FOR DELETE USING (public.has_child_write_access(child_id));
