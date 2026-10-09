-- Add scheduled activities while keeping AI assessment scoped to active activities.
-- Apply manually in the Supabase SQL Editor after review.

ALTER TABLE public.child_activities
  ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE public.child_activities
  DROP CONSTRAINT IF EXISTS child_activities_status_check;

ALTER TABLE public.child_activities
  ADD CONSTRAINT child_activities_status_check
  CHECK (status IN ('active', 'planned', 'paused', 'ended'));

ALTER TABLE public.child_activities
  DROP CONSTRAINT IF EXISTS child_activities_planned_start_date_check;

ALTER TABLE public.child_activities
  ADD CONSTRAINT child_activities_planned_start_date_check
  CHECK (status <> 'planned' OR start_date IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_child_activities_planned
  ON public.child_activities(child_id, start_date ASC)
  WHERE status = 'planned';
