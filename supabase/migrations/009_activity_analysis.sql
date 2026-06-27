-- Activity analysis MVP
-- Manual apply in Supabase SQL Editor after reviewing.

CREATE TABLE IF NOT EXISTS public.child_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  area        TEXT NOT NULL CHECK (area IN ('learning', 'physical', 'creative', 'social', 'emotion', 'reading', 'habit', 'other')),
  frequency   TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly_1', 'weekly_2', 'weekly_3', 'weekly_4_plus', 'irregular')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_assessments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id       UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  input_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  result_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary        TEXT NOT NULL DEFAULT '',
  score          INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_activities_child_id
  ON public.child_activities(child_id);

CREATE INDEX IF NOT EXISTS idx_child_activities_status
  ON public.child_activities(child_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_assessments_child_id
  ON public.activity_assessments(child_id, created_at DESC);

DROP TRIGGER IF EXISTS set_child_activities_updated_at ON public.child_activities;
CREATE TRIGGER set_child_activities_updated_at
  BEFORE UPDATE ON public.child_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.child_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "child_activities_select" ON public.child_activities;
CREATE POLICY "child_activities_select"
  ON public.child_activities
  FOR SELECT
  USING (public.has_child_access(child_id));

DROP POLICY IF EXISTS "child_activities_insert" ON public.child_activities;
CREATE POLICY "child_activities_insert"
  ON public.child_activities
  FOR INSERT
  WITH CHECK (public.has_child_write_access(child_id));

DROP POLICY IF EXISTS "child_activities_update" ON public.child_activities;
CREATE POLICY "child_activities_update"
  ON public.child_activities
  FOR UPDATE
  USING (public.has_child_write_access(child_id))
  WITH CHECK (public.has_child_write_access(child_id));

DROP POLICY IF EXISTS "child_activities_delete" ON public.child_activities;
CREATE POLICY "child_activities_delete"
  ON public.child_activities
  FOR DELETE
  USING (public.has_child_write_access(child_id));

DROP POLICY IF EXISTS "activity_assessments_select" ON public.activity_assessments;
CREATE POLICY "activity_assessments_select"
  ON public.activity_assessments
  FOR SELECT
  USING (public.has_child_access(child_id));

DROP POLICY IF EXISTS "activity_assessments_insert" ON public.activity_assessments;
CREATE POLICY "activity_assessments_insert"
  ON public.activity_assessments
  FOR INSERT
  WITH CHECK (public.has_child_write_access(child_id));
