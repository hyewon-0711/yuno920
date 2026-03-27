-- 주간 시간표 (스프레드시트/캡처 기준) → public.weekly_timetable
-- 1) migrations/003_weekly_timetable.sql 적용 여부 확인
-- 2) 아래 YOUR_CHILD_ID 를 해당 아이 children.id (UUID) 로 교체
-- 3) 이미 같은 child_id 로 넣은 적 있으면 중복 방지를 위해 먼저 DELETE

-- DELETE FROM public.weekly_timetable WHERE child_id = 'YOUR_CHILD_ID'::uuid;

-- 요일: 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일

INSERT INTO public.weekly_timetable (child_id, day_of_week, start_time, end_time, title, category, notes, color, sort_order)
VALUES
  -- ========== 월요일 (0) ==========
  ('YOUR_CHILD_ID'::uuid, 0, '09:00:00', '13:00:00', '학교', 'school', NULL, '#6B7280', 0),
  ('YOUR_CHILD_ID'::uuid, 0, '13:40:00', '15:00:00', '방과후 · 스마트레고블록A', 'afterschool', '13:40–15:00 / 스마트레고블록A (과학실2)', '#10B981', 1),
  ('YOUR_CHILD_ID'::uuid, 0, '15:15:00', '16:00:00', '구몬', 'academy', '15:15 시작', '#3B82F6', 2),
  ('YOUR_CHILD_ID'::uuid, 0, '16:20:00', '18:25:00', '폴리 셔틀', 'activity', '셔틀 16:20 · 수업 16:40–18:10 · 하차 약 18:25', '#F97316', 3),
  ('YOUR_CHILD_ID'::uuid, 0, '18:45:00', '20:07:00', '수영', 'activity', NULL, '#0EA5E9', 4),

  -- ========== 화요일 (1) ==========
  ('YOUR_CHILD_ID'::uuid, 1, '09:00:00', '13:00:00', '학교', 'school', NULL, '#6B7280', 0),
  ('YOUR_CHILD_ID'::uuid, 1, '13:40:00', '15:40:00', '올림수학', 'academy', '13:40–15:40', '#3B82F6', 1),
  ('YOUR_CHILD_ID'::uuid, 1, '16:00:00', '17:00:00', '피아노', 'activity', NULL, '#EC4899', 2),
  ('YOUR_CHILD_ID'::uuid, 1, '17:00:00', '18:00:00', '복싱', 'activity', NULL, '#F97316', 3),

  -- ========== 수요일 (2) ==========
  ('YOUR_CHILD_ID'::uuid, 2, '09:00:00', '12:30:00', '학교', 'school', NULL, '#6B7280', 0),
  ('YOUR_CHILD_ID'::uuid, 2, '13:00:00', '14:20:00', '방과후 · 웹툰교실A', 'afterschool', '13:00–14:20 / 웹툰교실A (과학실2)', '#10B981', 1),
  ('YOUR_CHILD_ID'::uuid, 2, '14:30:00', '16:00:00', '돌봄', 'care', NULL, '#EAB308', 2),
  ('YOUR_CHILD_ID'::uuid, 2, '16:20:00', '18:25:00', '폴리 셔틀', 'activity', '셔틀 16:20 · 수업 16:40–18:10 · 하차 약 18:25', '#F97316', 3),
  ('YOUR_CHILD_ID'::uuid, 2, '19:00:00', '19:30:00', '줄넘기', 'activity', NULL, '#8B5CF6', 4),

  -- ========== 목요일 (3) ==========
  ('YOUR_CHILD_ID'::uuid, 3, '09:00:00', '13:40:00', '학교', 'school', NULL, '#6B7280', 0),
  ('YOUR_CHILD_ID'::uuid, 3, '13:40:00', '15:00:00', '방과후 · 바둑A', 'afterschool', '13:40–15:00 / 바둑A (과학실1)', '#10B981', 1),
  ('YOUR_CHILD_ID'::uuid, 3, '15:00:00', '16:00:00', '돌봄', 'care', NULL, '#EAB308', 2),
  ('YOUR_CHILD_ID'::uuid, 3, '16:00:00', '17:00:00', '피아노', 'activity', NULL, '#EC4899', 3),
  ('YOUR_CHILD_ID'::uuid, 3, '17:00:00', '18:00:00', '복싱', 'activity', NULL, '#F97316', 4),

  -- ========== 금요일 (4) ==========
  ('YOUR_CHILD_ID'::uuid, 4, '09:00:00', '12:30:00', '학교', 'school', NULL, '#6B7280', 0),
  ('YOUR_CHILD_ID'::uuid, 4, '13:00:00', '14:20:00', '방과후 · 창의미술A', 'afterschool', '13:00–14:20 / 창의미술A (과학실2)', '#10B981', 1),
  ('YOUR_CHILD_ID'::uuid, 4, '14:30:00', '16:00:00', '돌봄', 'care', NULL, '#EAB308', 2),
  ('YOUR_CHILD_ID'::uuid, 4, '16:20:00', '18:25:00', '폴리 셔틀', 'activity', '셔틀 16:20 · 수업 16:40–18:10 · 하차 약 18:25', '#F97316', 3),
  ('YOUR_CHILD_ID'::uuid, 4, '19:00:00', '19:30:00', '줄넘기', 'activity', NULL, '#8B5CF6', 4),

  -- ========== 토요일 (5) ==========
  ('YOUR_CHILD_ID'::uuid, 5, '10:30:00', '13:30:00', 'CMS', 'academy', '수학 학원', '#3B82F6', 0),
  ('YOUR_CHILD_ID'::uuid, 5, '16:00:00', '17:00:00', 'K-pop 댄스', 'activity', NULL, '#EC4899', 1),
  ('YOUR_CHILD_ID'::uuid, 5, '19:00:00', '20:00:00', '천문대', 'activity', '매월 마지막 주 토요일 등 원본 일정에 맞춰 조정 가능', '#6366F1', 2);

-- 일요일(6): 원본에 일정 없음 → 행 없음
