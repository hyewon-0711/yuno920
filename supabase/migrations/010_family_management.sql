-- Secure family member management helpers used by Settings.

CREATE OR REPLACE FUNCTION public.add_family_member_by_email(
  p_child_id UUID,
  p_email TEXT,
  p_role family_role DEFAULT 'viewer'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF p_role = 'admin' THEN
    RAISE EXCEPTION '관리자 역할은 초대할 수 없습니다';
  END IF;

  IF NOT (
    public.is_child_owner(p_child_id)
    OR EXISTS (
      SELECT 1 FROM public.family_members
      WHERE child_id = p_child_id AND user_id = auth.uid() AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION '가족을 관리할 권한이 없습니다';
  END IF;

  SELECT id INTO target_user_id
  FROM public.users
  WHERE lower(email) = lower(trim(p_email));

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION '가입된 사용자를 찾을 수 없습니다';
  END IF;

  INSERT INTO public.family_members (user_id, child_id, role)
  VALUES (target_user_id, p_child_id, p_role)
  ON CONFLICT (user_id, child_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_family_member(
  p_child_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_child_owner(p_child_id)
    OR EXISTS (
      SELECT 1 FROM public.family_members
      WHERE child_id = p_child_id AND user_id = auth.uid() AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION '가족을 관리할 권한이 없습니다';
  END IF;

  IF EXISTS (SELECT 1 FROM public.children WHERE id = p_child_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION '아이 프로필 소유자는 삭제할 수 없습니다';
  END IF;

  DELETE FROM public.family_members WHERE child_id = p_child_id AND user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_family_member_by_email(UUID, TEXT, family_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_family_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_family_member_by_email(UUID, TEXT, family_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_family_member(UUID, UUID) TO authenticated;
