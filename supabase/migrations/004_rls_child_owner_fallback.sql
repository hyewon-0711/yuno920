-- children.user_id = auth.uid() 인 소유자는 family_members 행이 없어도
-- 자녀 관련 테이블 SELECT/INSERT 등이 가능하도록 헬퍼를 보강합니다.
-- (on_child_created 트리거 누락·수동 데이터·레거시 DB 대비)

CREATE OR REPLACE FUNCTION public.has_child_access(p_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND child_id = p_child_id
  ) OR public.is_child_owner(p_child_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_child_write_access(p_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND child_id = p_child_id AND role IN ('admin', 'editor')
  ) OR public.is_child_owner(p_child_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
