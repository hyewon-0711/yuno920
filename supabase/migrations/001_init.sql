-- ============================================================
-- Yuno920 — 초기 DB 마이그레이션
-- Supabase SQL Editor에서 실행
-- 실행 순서: Enum → Tables → Triggers → Functions → RLS → Indexes → Storage
-- ============================================================

-- ============================================================
-- Step 1: Enum 타입
-- ============================================================
CREATE TYPE family_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE mood_type AS ENUM ('happy', 'neutral', 'sad', 'sick', 'tired');
CREATE TYPE record_category AS ENUM (
  'health', 'meal', 'learning', 'play', 'emotion', 'reading', 'milestone'
);
CREATE TYPE repeat_type AS ENUM ('none', 'daily', 'weekly', 'monthly');
CREATE TYPE reading_category AS ENUM (
  'science', 'fairy_tale', 'history', 'art', 'math', 'society', 'etc'
);
CREATE TYPE game_type AS ENUM ('math', 'memory', 'reading_quiz');
CREATE TYPE report_type AS ENUM ('daily', 'weekly', 'monthly', 'personality');
CREATE TYPE milestone_category AS ENUM (
  'physical', 'cognitive', 'social', 'language', 'emotion', 'habit', 'etc'
);

-- ============================================================
-- Step 2: users (auth.users 확장)
-- ============================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Step 3: children
-- ============================================================
CREATE TABLE public.children (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  birth_date  DATE NOT NULL,
  gender      gender_type NOT NULL,
  birth_time  TIME,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Step 4: family_members
-- ============================================================
CREATE TABLE public.family_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  role        family_role NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id)
);

CREATE OR REPLACE FUNCTION public.handle_new_child()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.family_members (user_id, child_id, role)
  VALUES (NEW.user_id, NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_child_created
  AFTER INSERT ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_child();

-- ============================================================
-- Step 5: 데이터 테이블
-- ============================================================

-- schedules
CREATE TABLE public.schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  location    TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ,
  repeat_type repeat_type NOT NULL DEFAULT 'none',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- records
CREATE TABLE public.records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  mood        mood_type,
  categories  record_category[] DEFAULT '{}',
  photos      TEXT[] DEFAULT '{}',
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- milestones
CREATE TABLE public.milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        milestone_category NOT NULL DEFAULT 'etc',
  description     TEXT,
  photo_url       TEXT,
  milestone_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reading_logs
CREATE TABLE public.reading_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  category         reading_category NOT NULL DEFAULT 'etc',
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  memo             TEXT,
  read_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- growth_metrics
CREATE TABLE public.growth_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  height      DECIMAL(5,1),
  weight      DECIMAL(5,1),
  sr_score    INT CHECK (sr_score BETWEEN 0 AND 100),
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- hexagon_scores
CREATE TABLE public.hexagon_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  learning      INT NOT NULL CHECK (learning    BETWEEN 0 AND 100),
  physical      INT NOT NULL CHECK (physical    BETWEEN 0 AND 100),
  social        INT NOT NULL CHECK (social      BETWEEN 0 AND 100),
  emotion       INT NOT NULL CHECK (emotion     BETWEEN 0 AND 100),
  creativity    INT NOT NULL CHECK (creativity  BETWEEN 0 AND 100),
  habit         INT NOT NULL CHECK (habit       BETWEEN 0 AND 100),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- play_logs
CREATE TABLE public.play_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  game_type        game_type NOT NULL,
  score            INT NOT NULL DEFAULT 0,
  level            INT NOT NULL DEFAULT 1,
  correct_count    INT NOT NULL DEFAULT 0,
  total_count      INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  played_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ai_reports
CREATE TABLE public.ai_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  report_type  report_type NOT NULL,
  period_start DATE,
  period_end   DATE,
  content      TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Step 6: notifications
-- ============================================================
CREATE TABLE public.notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id         UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  record_reminder  BOOLEAN NOT NULL DEFAULT true,
  report_alert     BOOLEAN NOT NULL DEFAULT true,
  reminder_time    TIME NOT NULL DEFAULT '20:00',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id)
);

-- ============================================================
-- Step 7: 인덱스
-- ============================================================
CREATE INDEX idx_children_user_id ON public.children(user_id);
CREATE INDEX idx_family_members_child_id ON public.family_members(child_id);
CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX idx_schedules_child_id ON public.schedules(child_id);
CREATE INDEX idx_schedules_start_time ON public.schedules(child_id, start_time);
CREATE INDEX idx_records_child_id ON public.records(child_id);
CREATE INDEX idx_records_recorded_at ON public.records(child_id, recorded_at DESC);
CREATE INDEX idx_records_user_id ON public.records(user_id);
CREATE INDEX idx_milestones_child_id ON public.milestones(child_id);
CREATE INDEX idx_milestones_date ON public.milestones(child_id, milestone_date DESC);
CREATE INDEX idx_reading_logs_child_id ON public.reading_logs(child_id);
CREATE INDEX idx_reading_logs_read_date ON public.reading_logs(child_id, read_date DESC);
CREATE INDEX idx_growth_metrics_child_id ON public.growth_metrics(child_id);
CREATE INDEX idx_growth_metrics_recorded_at ON public.growth_metrics(child_id, recorded_at);
CREATE INDEX idx_hexagon_scores_child_id ON public.hexagon_scores(child_id);
CREATE INDEX idx_hexagon_scores_calculated_at ON public.hexagon_scores(child_id, calculated_at DESC);
CREATE INDEX idx_play_logs_child_id ON public.play_logs(child_id);
CREATE INDEX idx_play_logs_played_at ON public.play_logs(child_id, played_at DESC);
CREATE INDEX idx_play_logs_game_type ON public.play_logs(child_id, game_type);
CREATE INDEX idx_ai_reports_child_id ON public.ai_reports(child_id);
CREATE INDEX idx_ai_reports_lookup ON public.ai_reports(child_id, report_type, period_start, period_end);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- ============================================================
-- Step 8: RLS 헬퍼 함수 + 정책
-- ============================================================

-- 헬퍼 함수
CREATE OR REPLACE FUNCTION public.has_child_access(p_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND child_id = p_child_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_child_write_access(p_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND child_id = p_child_id AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_child_owner(p_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.children
    WHERE id = p_child_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- users RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_select_family" ON public.users FOR SELECT USING (
  id IN (
    SELECT fm2.user_id FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.child_id = fm2.child_id
    WHERE fm1.user_id = auth.uid()
  )
);

-- children RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "children_select" ON public.children FOR SELECT USING (public.has_child_access(id) OR user_id = auth.uid());
CREATE POLICY "children_insert" ON public.children FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "children_update" ON public.children FOR UPDATE USING (public.is_child_owner(id)) WITH CHECK (user_id = auth.uid());
CREATE POLICY "children_delete" ON public.children FOR DELETE USING (public.is_child_owner(id));

-- family_members RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_members_select" ON public.family_members FOR SELECT USING (public.has_child_access(child_id));
CREATE POLICY "family_members_insert" ON public.family_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND child_id = family_members.child_id AND role = 'admin'
  ) OR public.is_child_owner(child_id)
);
CREATE POLICY "family_members_delete" ON public.family_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.user_id = auth.uid() AND fm.child_id = family_members.child_id AND fm.role = 'admin'
  )
);

-- schedules RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_select" ON public.schedules FOR SELECT USING (public.has_child_access(child_id));
CREATE POLICY "schedules_insert" ON public.schedules FOR INSERT WITH CHECK (public.has_child_write_access(child_id));
CREATE POLICY "schedules_update" ON public.schedules FOR UPDATE USING (public.has_child_write_access(child_id));
CREATE POLICY "schedules_delete" ON public.schedules FOR DELETE USING (public.has_child_write_access(child_id));

-- records RLS
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "records_select" ON public.records FOR SELECT USING (public.has_child_access(child_id));
CREATE POLICY "records_insert" ON public.records FOR INSERT WITH CHECK (public.has_child_write_access(child_id));
CREATE POLICY "records_update" ON public.records FOR UPDATE USING (public.has_child_write_access(child_id));
CREATE POLICY "records_delete" ON public.records FOR DELETE USING (public.has_child_write_access(child_id));

-- milestones RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_select" ON public.milestones FOR SELECT USING (public.has_child_access(child_id));
CREATE POLICY "milestones_insert" ON public.milestones FOR INSERT WITH CHECK (public.has_child_write_access(child_id));
CREATE POLICY "milestones_update" ON public.milestones FOR UPDATE USING (public.has_child_write_access(child_id));
CREATE POLICY "milestones_delete" ON public.milestones FOR DELETE USING (public.has_child_write_access(child_id));

-- reading_logs RLS
ALTER TABLE public.reading_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_logs_select" ON public.reading_logs FOR SELECT USING (public.has_child_access(child_id));
CREATE POLICY "reading_logs_insert" ON public.reading_logs FOR INSERT WITH CHECK (public.has_child_write_access(child_id));
CREATE POLICY "reading_logs_update" ON public.reading_logs FOR UPDATE USING (public.has_child_write_access(child_id));
CREATE POLICY "reading_logs_delete" ON public.reading_logs FOR DELETE USING (public.has_child_write_access(child_id));

-- growth_metrics RLS
ALTER TABLE public.growth_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "growth_metrics_select" ON public.growth_metrics FOR SELECT USING (public.has_child_access(child_id));
CREATE POLICY "growth_metrics_insert" ON public.growth_metrics FOR INSERT WITH CHECK (public.has_child_write_access(child_id));
CREATE POLICY "growth_metrics_update" ON public.growth_metrics FOR UPDATE USING (public.has_child_write_access(child_id));
CREATE POLICY "growth_metrics_delete" ON public.growth_metrics FOR DELETE USING (public.has_child_write_access(child_id));

-- hexagon_scores RLS
ALTER TABLE public.hexagon_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hexagon_scores_select" ON public.hexagon_scores FOR SELECT USING (public.has_child_access(child_id));

-- play_logs RLS
ALTER TABLE public.play_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "play_logs_select" ON public.play_logs FOR SELECT USING (public.has_child_access(child_id));
CREATE POLICY "play_logs_insert" ON public.play_logs FOR INSERT WITH CHECK (public.has_child_access(child_id));

-- ai_reports RLS
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_reports_select" ON public.ai_reports FOR SELECT USING (public.has_child_access(child_id));

-- notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- Step 9: Storage 버킷
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('record-photos', 'record-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('milestone-photos', 'milestone-photos', false);

CREATE POLICY "record_photos_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'record-photos' AND auth.role() = 'authenticated');
CREATE POLICY "record_photos_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'record-photos' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
