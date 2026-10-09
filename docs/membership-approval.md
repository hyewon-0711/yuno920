# 가입 승인 적용 안내

## 구현 범위

- 계정 생성 시 `membership_approvals.status = pending` 자동 생성.
- 이메일 인증과 운영자 승인을 모두 마쳐야 아이 등록·기록·AI·사진 업로드 이용 가능.
- 승인 전 로그인은 가능하며 `/auth/pending`에서 상태 확인·로그아웃·비밀번호 재설정 가능.
- `/admin/members`에서 50명 단위 상태별 목록, 승인·거절·재심사·정지·재개 제공.
- 승인/거절 사유는 운영 기록이며 사용자에게 직접 공개하지 않음.
- 승인 처리에는 이전 상태·변경 상태·운영자·시각·사유가 같은 트랜잭션에 기록됨.
- 동시에 변경하면 version 충돌로 거부. 본인 심사 금지. 가족 admin은 운영자 권한이 아님.
- DB/Storage RLS와 FastAPI 모두 매 요청 상태 검사. 브라우저는 페이지 이동·포커스·30초 간격으로 재검사.
- 공개 날씨·급식·일반 뉴스 API는 개인정보를 제공하지 않는 공개 기능으로 유지.

## 운영 반영 순서 (소유자가 직접 실행)

1. 현재 운영 DB 백업, 기존 사용 중인 계정과 첫 운영자의 이메일 인증 여부 확인.
2. 운영자 이메일/UUID 및 계속 사용할 기존 계정 목록을 확정.
3. 마이그레이션 001~011 적용 상태 확인 후 `012_membership_approval.sql` 검토 및 실행.
4. 아래 초기 운영자 지정 SQL의 이메일을 실제 값으로 바꾸어 실행.
5. 계속 사용할 기존 사용자도 아래 함수로 명시적으로 승인.
6. 백엔드와 프론트엔드를 배포하고 아래 검증표 실행.

**012 적용 즉시 기존 사용자도 pending이므로 DB 접근이 차단된다.** 적용/초기 승인/배포를 짧은 점검 시간에 함께 진행한다. 승인 테이블이 없거나 조회가 실패하면 새 앱은 접근을 허용하지 않으므로, SQL을 적용하지 않은 상태로 새 코드를 먼저 배포하지 않는다. 계정/아이/기록 데이터는 삭제하지 않는다.

### 첫 운영자 지정

첫 운영자는 소유자만 Supabase SQL Editor에서 지정한다. 이메일 인증 완료 계정만 가능하다. 사용자가 가입 폼에서 운영자 권한을 지정하는 경로는 없다.

```sql
BEGIN;
DO $$
DECLARE
  operator_id UUID;
  old_status TEXT;
BEGIN
  SELECT id INTO operator_id FROM auth.users
  WHERE lower(email) = lower('운영자_이메일로_교체')
    AND email_confirmed_at IS NOT NULL;
  IF operator_id IS NULL THEN
    RAISE EXCEPTION '이메일 인증이 완료된 운영자 계정을 찾을 수 없습니다';
  END IF;
  SELECT status INTO old_status FROM public.membership_approvals
  WHERE user_id = operator_id FOR UPDATE;
  IF old_status IS NULL THEN RAISE EXCEPTION '012 마이그레이션을 먼저 적용해주세요'; END IF;
  INSERT INTO public.service_operators(user_id) VALUES (operator_id)
    ON CONFLICT DO NOTHING;
  IF old_status <> 'approved' THEN
    UPDATE public.membership_approvals SET status = 'approved', version = version + 1,
      reviewed_at = now(), reviewed_by = operator_id WHERE user_id = operator_id;
    INSERT INTO public.membership_review_log(user_id, actor_id, previous_status, new_status, reason)
      VALUES (operator_id, operator_id, old_status, 'approved', '소유자가 첫 운영자 지정');
  END IF;
END;
$$;
COMMIT;
```

### 계속 사용할 기존 계정 승인

운영자 지정 후 아래 SQL로 명시한 계정만 승인한다. 신규 pending 계정을 전체 승인하는 쿼리를 사용하지 않는다. 첫 운영자 UUID와 대상 UUID는 `auth.users`에서 확인한다. JWT claims는 SQL Editor의 이 트랜잭션 내부에서만 설정된다.

```sql
BEGIN;
SELECT set_config('request.jwt.claim.sub', '첫_운영자_UUID', true);
-- 대상은 이메일 인증을 완료해야 한다. 현재 version을 조회하고 대입한다.
SELECT user_id, status, version FROM public.membership_approvals
WHERE user_id = '대상_사용자_UUID'::uuid;
SELECT public.review_membership(
  '대상_사용자_UUID'::uuid, 'approved', 1, '기존 서비스 이용자 확인'
);
COMMIT;
```

## 검증

| 시나리오 | 기대 결과 |
|---|---|
| 새 가입 | Auth 계정 및 pending 행 생성, 이메일 인증 안내 |
| 이메일 인증 후 로그인 | 승인 대기 화면, 앱 본문 미노출 |
| 미인증 신청 승인 시도 | 거부 |
| 일반 사용자의 승인 RPC·운영자 목록 조회 | 거부 |
| pending의 DB 직접 SELECT/INSERT/UPDATE/DELETE | 접근 불가 |
| pending의 가족 관리 RPC·사진 업로드·AI/놀이 API | 접근 불가 |
| 본인 승인 상태 변경 또는 운영자 등록 직접 시도 | 거부 |
| 운영자 승인 | 감사 로그 생성, 사용자 새로고침 후 아이 등록/대시보드 |
| 같은 version으로 중복 결정 | 충돌, 목록 새로고침 안내 |
| 로그인된 계정 이용 정지 | 기존 JWT로 새 API/DB 요청 거부 |
| 승인 테이블 누락/조회 실패 | 접근 거부와 재시도 안내 |
| 거절 후 재심사 | pending으로 복귀, 별도 승인 필요 |

`backend/tests/test_membership_auth.py`는 모의 DB 응답으로 승인/거부/장애/정지 후 재요청을 검증한다.
`supabase/tests/membership-approval.mjs`는 임시 PGlite DB에 실제 마이그레이션을 적용하고 RLS/RPC 권한을 검증한다. 실행 방법은 파일 상단 참고.

## 알려진 범위

- 승인 결과 자동 메일은 아직 제공하지 않음. 대기 화면에서 상태 새로고침으로 확인.
- 기존 avatars 버킷은 public이므로 이미 공개된 사진 URL은 RLS로 비공개 전환되지 않는다. 이번 변경은 업로드 접근을 제한한다. 전체 비공개 전환은 URL/이미지 표시 방식을 함께 변경하는 별도 작업이 필요하다.
- 브라우저에 이미 내려받은 정보는 이용 정지로 회수할 수 없다. 이후 DB/API 요청은 차단한다.
- 운영 DB에 저장소에 없는 정책·함수·버킷이 있다면 배포 전 동일한 승인 조건 적용 여부를 추가 확인한다.
- 실패 시 기존 데이터를 삭제하거나 승인 정책을 해제하지 않는다. 배포 오류를 수정하고, 필요하면 점검 화면을 유지한다.
