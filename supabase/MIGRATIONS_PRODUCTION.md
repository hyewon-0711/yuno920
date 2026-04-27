# 운영(Supabase) DB 마이그레이션 적용 순서

`001`은 **프로젝트 생성 직후 이미 있다면 건너뛰기** (중복 오류). 이후 **번호 순**으로, 아직 적용되지 않은 것만 **SQL Editor**에서 실행하세요.

| 순서 | 파일 | 설명 |
|------|------|------|
| 1 | `001_init.sql` | 최초 스키마(이미 있으면 스킵) |
| 2 | `002_growth_enhancements.sql` | 성장 관련 |
| 3 | `003_weekly_timetable.sql` | 주간 시간표 + RLS |
| 4 | `004_rls_child_owner_fallback.sql` | `family_members` 없을 때 소유자 fallback RLS |
| 5 | `005_growth_metrics_memo.sql` | growth_metrics `memo` 등 |
| 6 | `006_parent_interest_tags.sql` | `users.parent_interest_tags` (Insight 관심사) |

**확인:** `public.users`에 `parent_interest_tags`가 있는지, `weekly_timetable` 테이블이 있는지 Table Editor로 확인.

**API 스키마 캐시:** 드물게 PostgREST가 컬럼을 못 보면 **Project Settings → API → Reload schema** 또는 잠시 대기.
