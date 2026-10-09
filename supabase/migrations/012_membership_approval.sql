-- Review and apply manually. Existing accounts remain pending until explicitly
-- approved by the owner; see docs/membership-approval.md for bootstrap steps.
BEGIN;

CREATE TABLE public.membership_approvals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  version INTEGER NOT NULL DEFAULT 1,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX membership_approvals_queue ON public.membership_approvals(status, requested_at, user_id);

-- Service operators are unrelated to family_members.role = 'admin'.
CREATE TABLE public.service_operators (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.membership_review_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX membership_review_log_user ON public.membership_review_log(user_id, created_at DESC);

ALTER TABLE public.membership_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_review_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.membership_approvals, public.service_operators, public.membership_review_log FROM anon, authenticated;
GRANT SELECT ON public.membership_approvals TO authenticated;
GRANT ALL ON public.membership_approvals, public.service_operators, public.membership_review_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.membership_review_log_id_seq TO service_role;
CREATE POLICY membership_select_own ON public.membership_approvals
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.create_pending_membership() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.membership_approvals(user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_pending_membership() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_membership AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_pending_membership();
INSERT INTO public.membership_approvals(user_id, requested_at)
SELECT id, created_at FROM auth.users ON CONFLICT (user_id) DO NOTHING;

-- The service-only predicate is also used by FastAPI, which bypasses RLS.
CREATE FUNCTION public.is_user_approved(p_user_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membership_approvals m JOIN auth.users u ON u.id = m.user_id
    WHERE m.user_id = p_user_id AND m.status = 'approved' AND u.email_confirmed_at IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.is_user_approved(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_approved(UUID) TO service_role;

CREATE FUNCTION public.is_approved_member() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_user_approved(auth.uid());
$$;
CREATE FUNCTION public.is_service_operator() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_approved_member() AND EXISTS (
    SELECT 1 FROM public.service_operators WHERE user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_approved_member(), public.is_service_operator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_member(), public.is_service_operator() TO anon, authenticated, service_role;

CREATE FUNCTION public.get_my_membership() RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'status', m.status, 'email_verified', u.email_confirmed_at IS NOT NULL,
    'is_operator', public.is_service_operator(), 'requested_at', m.requested_at
  ) FROM public.membership_approvals m JOIN auth.users u ON u.id = m.user_id
  WHERE m.user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_membership() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_membership() TO authenticated;

-- Add an AND constraint to every existing application policy. A permissive
-- approval policy would instead OR with existing ownership policies.
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'children', 'family_members', 'schedules', 'records', 'milestones',
    'reading_logs', 'growth_metrics', 'hexagon_scores', 'play_logs', 'ai_reports',
    'notifications', 'weekly_timetable', 'child_activities', 'activity_assessments'
  ] LOOP
    EXECUTE format('CREATE POLICY membership_required ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING ((SELECT public.is_approved_member())) WITH CHECK ((SELECT public.is_approved_member()))', table_name);
  END LOOP;
END;
$$;
CREATE POLICY membership_required ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (bucket_id NOT IN ('avatars', 'record-photos', 'milestone-photos') OR (SELECT public.is_approved_member()))
  WITH CHECK (bucket_id NOT IN ('avatars', 'record-photos', 'milestone-photos') OR (SELECT public.is_approved_member()));
-- avatars is currently a public bucket: previously published avatar URLs remain
-- public. This migration gates uploads, not public downloads (see rollout notes).

CREATE OR REPLACE FUNCTION public.is_child_owner(p_child_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_approved_member() AND EXISTS (
    SELECT 1 FROM public.children WHERE id = p_child_id AND user_id = auth.uid()
  );
$$;
CREATE OR REPLACE FUNCTION public.has_child_access(p_child_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_approved_member() AND (public.is_child_owner(p_child_id) OR EXISTS (
    SELECT 1 FROM public.family_members WHERE child_id = p_child_id AND user_id = auth.uid()
  ));
$$;
CREATE OR REPLACE FUNCTION public.has_child_write_access(p_child_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_approved_member() AND (public.is_child_owner(p_child_id) OR EXISTS (
    SELECT 1 FROM public.family_members WHERE child_id = p_child_id AND user_id = auth.uid() AND role IN ('admin', 'editor')
  ));
$$;

-- SECURITY DEFINER family RPCs bypass table RLS, so check the caller explicitly.
CREATE OR REPLACE FUNCTION public.add_family_member_by_email(p_child_id UUID, p_email TEXT, p_role public.family_role DEFAULT 'viewer') RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_user_id UUID;
BEGIN
  IF NOT public.is_approved_member() THEN RAISE EXCEPTION '승인된 계정만 이용할 수 있습니다' USING ERRCODE = '42501'; END IF;
  IF p_role = 'admin' THEN RAISE EXCEPTION '관리자 역할은 초대할 수 없습니다'; END IF;
  IF NOT (public.is_child_owner(p_child_id) OR EXISTS (SELECT 1 FROM public.family_members WHERE child_id = p_child_id AND user_id = auth.uid() AND role = 'admin')) THEN
    RAISE EXCEPTION '가족을 관리할 권한이 없습니다' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO target_user_id FROM public.users WHERE lower(email) = lower(trim(p_email));
  IF target_user_id IS NULL OR NOT public.is_user_approved(target_user_id) THEN RAISE EXCEPTION '승인된 사용자를 찾을 수 없습니다'; END IF;
  INSERT INTO public.family_members(user_id, child_id, role) VALUES (target_user_id, p_child_id, p_role)
  ON CONFLICT (user_id, child_id) DO UPDATE SET role = EXCLUDED.role;
  RETURN target_user_id;
END;
$$;
CREATE OR REPLACE FUNCTION public.remove_family_member(p_child_id UUID, p_user_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_approved_member() THEN RAISE EXCEPTION '승인된 계정만 이용할 수 있습니다' USING ERRCODE = '42501'; END IF;
  IF NOT (public.is_child_owner(p_child_id) OR EXISTS (SELECT 1 FROM public.family_members WHERE child_id = p_child_id AND user_id = auth.uid() AND role = 'admin')) THEN
    RAISE EXCEPTION '가족을 관리할 권한이 없습니다' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.children WHERE id = p_child_id AND user_id = p_user_id) THEN RAISE EXCEPTION '아이 프로필 소유자는 삭제할 수 없습니다'; END IF;
  DELETE FROM public.family_members WHERE child_id = p_child_id AND user_id = p_user_id;
END;
$$;

CREATE FUNCTION public.list_memberships(p_status TEXT DEFAULT 'pending', p_offset INTEGER DEFAULT 0)
RETURNS TABLE(user_id UUID, email TEXT, name TEXT, status TEXT, version INTEGER, requested_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, email_verified BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_service_operator() THEN RAISE EXCEPTION '운영자 권한이 필요합니다' USING ERRCODE = '42501'; END IF;
  IF p_status NOT IN ('pending', 'approved', 'rejected', 'suspended') OR p_status IS NULL OR p_offset IS NULL OR p_offset < 0 THEN RAISE EXCEPTION '잘못된 조회 조건입니다'; END IF;
  RETURN QUERY SELECT m.user_id, u.email::TEXT, coalesce(p.name, ''), m.status, m.version, m.requested_at, m.reviewed_at, u.email_confirmed_at IS NOT NULL
    FROM public.membership_approvals m JOIN auth.users u ON u.id = m.user_id LEFT JOIN public.users p ON p.id = m.user_id
    WHERE m.status = p_status ORDER BY m.requested_at, m.user_id LIMIT 50 OFFSET p_offset;
END;
$$;

CREATE FUNCTION public.review_membership(p_user_id UUID, p_status TEXT, p_expected_version INTEGER, p_reason TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_row public.membership_approvals%ROWTYPE;
BEGIN
  -- Serialize operator decisions, including suspension of another operator.
  PERFORM pg_advisory_xact_lock(920, 12);
  IF NOT public.is_service_operator() THEN RAISE EXCEPTION '운영자 권한이 필요합니다' USING ERRCODE = '42501'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION '본인 계정은 심사할 수 없습니다'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION '처리 사유를 1~500자로 입력해주세요'; END IF;
  SELECT * INTO current_row FROM public.membership_approvals WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '가입 신청을 찾을 수 없습니다'; END IF;
  IF p_expected_version IS DISTINCT FROM current_row.version THEN RAISE EXCEPTION '다른 운영자가 변경했습니다. 목록을 새로고침해주세요' USING ERRCODE = '40001'; END IF;
  IF p_status IS NULL OR NOT (
    (current_row.status = 'pending' AND p_status IN ('approved', 'rejected')) OR
    (current_row.status = 'approved' AND p_status = 'suspended') OR
    (current_row.status = 'suspended' AND p_status = 'approved') OR
    (current_row.status = 'rejected' AND p_status = 'pending')
  ) THEN RAISE EXCEPTION '허용되지 않은 상태 변경입니다'; END IF;
  IF p_status = 'approved' AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id AND email_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION '이메일 인증을 먼저 완료해야 합니다';
  END IF;
  UPDATE public.membership_approvals SET status = p_status, version = version + 1, reviewed_at = now(), reviewed_by = auth.uid() WHERE user_id = p_user_id;
  INSERT INTO public.membership_review_log(user_id, actor_id, previous_status, new_status, reason)
    VALUES (p_user_id, auth.uid(), current_row.status, p_status, trim(p_reason));
END;
$$;
REVOKE ALL ON FUNCTION public.list_memberships(TEXT, INTEGER), public.review_membership(UUID, TEXT, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_memberships(TEXT, INTEGER), public.review_membership(UUID, TEXT, INTEGER, TEXT) TO authenticated;

COMMIT;
