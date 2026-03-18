# 기능 정의서: Auth/Common (인증/공통)

> 대상 사용자: 부모 (Primary) | 관련 탭: 전체 | 기반 서비스: Supabase Auth

---

## 개요

인증 및 공통 기능은 서비스의 기반이 되는 계정 관리, 아이 프로필, 가족 공유, 하단 네비게이션, 알림, 설정 등을 정의한다. Supabase Auth를 기반으로 이메일/소셜 로그인을 지원하고, RLS(Row Level Security) 정책으로 데이터 접근을 제어한다.

---

## AUTH-01: 회원가입 / 로그인

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AUTH-01 |
| 기능명 | 회원가입 / 로그인 |
| 목적 | 사용자 인증 및 세션 관리 (이메일, Google, Kakao) |
| 우선순위 | P0 (Sprint 1) |

### 사용자 스토리

- 부모로서, 나는 이메일로 간편하게 회원가입하고 싶다
- 부모로서, 나는 Google 또는 카카오 계정으로 빠르게 로그인하고 싶다
- 부모로서, 나는 로그인 상태가 유지되어 매번 로그인하지 않아도 되면 좋겠다

### 입력 / 출력

| 구분 | 내용 |
|------|------|
| 입력 (이메일 가입) | 이메일, 비밀번호 (8자 이상, 영문+숫자) |
| 입력 (소셜 로그인) | OAuth 리다이렉트 (Google/Kakao) |
| 출력 | 인증 세션 (JWT), 사용자 프로필, 리다이렉트 (Home 또는 아이 프로필 등록) |

### UI 요소

| 화면 | 요소 |
|------|------|
| 랜딩 페이지 | 서비스 소개, "시작하기" CTA, "이미 계정이 있으신가요? 로그인" 링크 |
| 회원가입 | 이메일 입력, 비밀번호 입력, 비밀번호 확인, "회원가입" 버튼, 소셜 로그인 버튼 |
| 로그인 | 이메일 입력, 비밀번호 입력, "로그인" 버튼, 소셜 로그인 버튼, "비밀번호 찾기" 링크 |
| 비밀번호 재설정 | 이메일 입력, "재설정 링크 보내기" 버튼 |

### 비즈니스 로직

**이메일 회원가입 플로우:**

```
1. 사용자가 이메일/비밀번호 입력
2. 프론트엔드 유효성 검사:
   - 이메일 형식 체크
   - 비밀번호: 8자 이상, 영문 + 숫자 포함
   - 비밀번호 확인 일치
3. supabase.auth.signUp({ email, password }) 호출
4. Supabase가 확인 이메일 발송 (선택적: 이메일 확인 비활성화 가능)
5. 가입 성공 시 users 테이블에 자동 INSERT (Supabase trigger)
6. 세션 생성 → 아이 프로필 등록 페이지로 리다이렉트
```

**소셜 로그인 (Google) 플로우:**

```
1. "Google로 로그인" 버튼 클릭
2. supabase.auth.signInWithOAuth({ provider: 'google' }) 호출
3. Google OAuth 동의 화면 → 승인
4. 콜백 URL로 리다이렉트
5. Supabase가 자동으로 auth.users 생성
6. users 테이블에 INSERT (trigger)
7. 아이 프로필이 없으면 → 프로필 등록 / 있으면 → Home
```

**소셜 로그인 (Kakao) 플로우:**

```
1. "카카오로 로그인" 버튼 클릭
2. supabase.auth.signInWithOAuth({ provider: 'kakao' }) 호출
3. Kakao OAuth 동의 화면 → 승인
4. 콜백 URL로 리다이렉트
5. 이후 Google과 동일
```

### Supabase Auth 통합 상세

| 항목 | 설정 |
|------|------|
| Auth Provider | Email, Google, Kakao |
| Session 관리 | Supabase 자동 관리 (JWT, refresh token) |
| 세션 지속 시간 | 1시간 (access), 30일 (refresh) |
| 콜백 URL | `{APP_URL}/auth/callback` |
| 이메일 확인 | 개발: 비활성화 / 프로덕션: 활성화 |
| 비밀번호 정책 | 최소 8자, 영문+숫자 |

**Supabase users 테이블 자동 생성 trigger:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### RLS 정책

```sql
-- users 테이블: 본인 데이터만 읽기/수정
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 예외 처리

| 상황 | 처리 |
|------|------|
| 이미 가입된 이메일 | "이미 등록된 이메일입니다. 로그인하거나 비밀번호를 재설정해주세요." |
| 비밀번호 불일치 (로그인) | "이메일 또는 비밀번호가 올바르지 않습니다." (보안상 구체적으로 안 알림) |
| 소셜 로그인 취소 | 로그인 페이지로 복귀, 별도 에러 메시지 없음 |
| 네트워크 오류 | "네트워크 연결을 확인해주세요." 토스트 |
| 세션 만료 | 자동 refresh 시도 → 실패 시 로그인 페이지로 리다이렉트 |
| 이메일 확인 미완료 | "이메일 확인 후 로그인해주세요." + 재발송 버튼 |

---

## AUTH-02: 아이 프로필 등록

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AUTH-02 |
| 기능명 | 아이 프로필 등록 |
| 목적 | 서비스 핵심 대상인 아이의 기본 정보를 등록하여 맞춤형 서비스 제공 |
| 우선순위 | P0 (Sprint 1) |

### 사용자 스토리

- 부모로서, 나는 회원가입 후 아이의 기본 정보를 등록하고 싶다
- 부모로서, 나는 출생시간은 나중에 추가할 수 있으면 좋겠다
- 부모로서, 나는 아이 사진을 등록하여 개인화된 경험을 원한다

### 입력 / 출력

| 구분 | 항목 | 타입 | 필수 |
|------|------|------|------|
| 입력 | 이름 | string (2~20자) | 필수 |
| 입력 | 생년월일 | date (YYYY-MM-DD) | 필수 |
| 입력 | 성별 | enum ('male', 'female') | 필수 |
| 입력 | 출생 시간 | time (HH:MM) | 선택 |
| 입력 | 프로필 사진 | image (jpg/png, 최대 5MB) | 선택 |
| 출력 | children 레코드 생성, 초기 hexagon_scores 생성 |

### UI 요소

| 요소 | 설명 |
|------|------|
| 아바타 영역 | 64px 원형, 기본 아바타 또는 업로드 사진, 📷 변경 버튼 |
| 이름 필드 | 텍스트 입력 (placeholder: "아이 이름") |
| 생년월일 | 날짜 선택기 (bottom sheet date picker) |
| 성별 | 라디오 버튼 (남/여) |
| 출생 시간 | 시간 선택기 (선택 사항, "나중에 추가 가능" 안내) |
| 시작하기 버튼 | Primary 버튼, 필수 항목 입력 시 활성화 |

### 비즈니스 로직

```
1. 필수 항목 (이름, 생년월일, 성별) 유효성 검사
2. 사진이 있으면 Supabase Storage에 업로드
   - 경로: children-avatars/{user_id}/{child_id}.jpg
   - 공개 URL 생성
3. children 테이블에 INSERT
4. hexagon_scores 테이블에 초기 레코드 생성 (6개 영역, 모두 50점)
5. Home 페이지로 리다이렉트
```

**나이 계산 로직:**

```
만 나이 = floor((오늘 - 생년월일) / 365.25)
대상 연령: 6~10세 (서비스 대상이 아닌 경우에도 가입 가능, 안내만 표시)
```

### Supabase Auth 통합

```
- children.user_id = auth.uid() (로그인된 사용자)
- 한 사용자가 여러 아이를 등록 가능 (추후 아이 전환 기능)
- MVP에서는 1명으로 제한 (추후 확장)
```

### RLS 정책

```sql
-- children 테이블
CREATE POLICY "Users can read own children" ON children
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own children" ON children
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own children" ON children
  FOR UPDATE USING (user_id = auth.uid());

-- family_members를 통한 접근 (AUTH-03 이후)
CREATE POLICY "Family members can read children" ON children
  FOR SELECT USING (
    id IN (
      SELECT child_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );
```

### 예외 처리

| 상황 | 처리 |
|------|------|
| 이름 미입력 | "이름을 입력해주세요" 필드 하단 에러 메시지 |
| 이름 20자 초과 | "이름은 20자 이내로 입력해주세요" |
| 생년월일 미래 날짜 | "올바른 생년월일을 선택해주세요" |
| 생년월일 > 13세 | "서비스 대상 연령(6~10세)이 아닙니다. 계속하시겠습니까?" 확인 모달 |
| 사진 업로드 실패 | "사진 업로드에 실패했어요. 나중에 설정에서 추가할 수 있어요." 토스트 |
| 사진 5MB 초과 | "사진 크기를 5MB 이하로 줄여주세요" |

---

## AUTH-03: 가족 초대

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AUTH-03 |
| 기능명 | 가족 초대 |
| 목적 | 가족 구성원이 아이의 데이터를 공유하며, 역할별 권한 관리 |
| 우선순위 | P2 (Sprint 5) |

### 사용자 스토리

- 부모로서, 나는 배우자에게 초대 링크를 보내 함께 기록을 관리하고 싶다
- 부모로서, 나는 조부모에게 뷰어 권한만 부여하여 성장 기록을 공유하고 싶다
- 관리자로서, 나는 가족 구성원의 권한을 변경하거나 제거할 수 있어야 한다

### 입력 / 출력

| 구분 | 내용 |
|------|------|
| 입력 | 초대 대상 역할 선택 (관리자/편집자/뷰어), 초대 링크 생성 요청 |
| 출력 | 초대 링크 (유효기간 포함), family_members 레코드 생성 |

### UI 요소

| 요소 | 설명 |
|------|------|
| 가족 관리 섹션 | 설정 페이지 내, 현재 가족 구성원 목록 (아바타, 이름, 역할) |
| 초대 버튼 | "+ 가족 초대" 버튼 |
| 역할 선택 | 바텀 시트 — 관리자/편집자/뷰어 라디오 (각 역할 설명 포함) |
| 초대 링크 | 링크 복사 버튼, 카카오톡 공유 버튼 |
| 권한 변경 | 가족 구성원 옆 역할 탭 → 변경 바텀 시트 |
| 제거 | 스와이프 삭제 또는 "제거" 버튼 (확인 모달) |

### 비즈니스 로직

**권한 체계:**

| 역할 | 코드 | 기록 읽기 | 기록 작성 | 게임 플레이 | AI 리포트 | 설정 변경 | 가족 관리 |
|------|------|-----------|-----------|-------------|-----------|-----------|-----------|
| 관리자 | admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 편집자 | editor | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 뷰어 | viewer | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

**초대 링크 생성 플로우:**

```
1. 관리자가 역할 선택 후 "초대 링크 생성" 클릭
2. family_invitations 테이블에 레코드 생성:
   - invite_code: UUID (랜덤)
   - child_id: 현재 선택된 아이
   - role: 선택한 역할
   - created_by: auth.uid()
   - expires_at: NOW() + 7일
   - used: false
3. 초대 URL 생성: {APP_URL}/invite/{invite_code}
4. 링크 복사 또는 카카오 공유
```

**초대 수락 플로우:**

```
1. 초대받은 사용자가 링크 클릭
2. 로그인 안 된 상태 → 회원가입/로그인 후 초대 처리
3. 로그인 된 상태 → 초대 정보 표시 ("윤호의 기록에 초대되었습니다")
4. "수락" 클릭
5. family_invitations 유효성 검증 (만료 여부, 사용 여부)
6. family_members 테이블에 INSERT
7. family_invitations.used = true 업데이트
8. Home으로 리다이렉트 (해당 아이 데이터 접근 가능)
```

### Supabase Auth 통합

```
- family_members 테이블로 다대다 관계 관리
- 초대받은 사용자는 Supabase Auth에 별도 계정 존재
- RLS 정책에서 family_members를 통한 접근 제어
```

### RLS 정책

```sql
-- family_members 테이블
CREATE POLICY "Users can read family memberships" ON family_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage family members" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.child_id = family_members.child_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
  );

-- 모든 데이터 테이블에 family_members 기반 접근 추가 (records 예시)
CREATE POLICY "Family members can read records" ON records
  FOR SELECT USING (
    child_id IN (
      SELECT child_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can write records" ON records
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT child_id FROM family_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
```

### 예외 처리

| 상황 | 처리 |
|------|------|
| 초대 링크 만료 (7일 초과) | "초대 링크가 만료되었습니다. 새 링크를 요청해주세요." |
| 이미 사용된 링크 | "이미 사용된 초대 링크입니다." |
| 자기 자신 초대 | 초대 수락 시 이미 본인의 아이인 경우 "이미 등록된 가족입니다" |
| 비로그인 상태에서 초대 클릭 | 초대 코드를 쿼리 파라미터로 유지한 채 로그인 페이지로 이동, 로그인 후 자동 수락 처리 |
| 관리자가 아닌 사용자의 초대 시도 | 초대 버튼 미노출 (UI에서 제어) |

---

## COMM-01: 하단 네비게이션

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | COMM-01 |
| 기능명 | 하단 네비게이션 |
| 목적 | 5개 주요 탭 간의 빠른 이동 제공 |
| 우선순위 | P0 (Sprint 1) |

### 사용자 스토리

- 사용자로서, 나는 화면 하단에서 한 번의 탭으로 주요 기능에 접근하고 싶다
- 사용자로서, 나는 현재 어떤 탭에 있는지 시각적으로 알 수 있어야 한다

### 입력 / 출력

| 구분 | 내용 |
|------|------|
| 입력 | 탭 아이콘 터치 |
| 출력 | 해당 탭 페이지로 라우팅, 활성 탭 하이라이트 |

### UI 요소

| 속성 | 값 |
|------|-----|
| 높이 | 64px |
| 배경 | white |
| 그림자 | shadow-lg (위 방향) |
| 아이콘 크기 | 24px |
| 라벨 크기 | 10px |
| 안전 영역 | bottom safe area 포함 (iOS notch 대응) |

### 탭 구성

| # | 탭명 | 아이콘 (Lucide) | 라우트 | 테마 컬러 |
|---|------|----------------|--------|-----------|
| 1 | Home | `Home` | `/` | `#F97316` (Orange) |
| 2 | Growth | `TrendingUp` | `/growth` | `#10B981` (Green) |
| 3 | Record | `PenSquare` | `/record` | `#3B82F6` (Blue) |
| 4 | Play | `Gamepad2` | `/play` | `#8B5CF6` (Purple) |
| 5 | Insight | `Sparkles` | `/insight` | `#6366F1` (Indigo) |

### 비즈니스 로직

```
1. 현재 라우트에 따라 활성 탭 결정
2. 활성 탭: 해당 테마 컬러 (아이콘 + 라벨)
3. 비활성 탭: gray-400
4. 탭 전환 시 애니메이션 없음 (즉시 전환)
5. 로그인 필요 페이지 → 비로그인 시 하단 네비 숨김
6. 게임 플레이 중 → 하단 네비 숨김 (몰입 모드)
```

### Supabase Auth 통합

```
- 비로그인 상태: 하단 네비 숨김, 랜딩/로그인 페이지만 표시
- 로그인 상태: 하단 네비 표시
- 아이 프로필 미등록: 프로필 등록 페이지에서 네비 숨김
```

### RLS 정책

> COMM-01 자체에는 RLS 정책 없음. 각 탭의 데이터 접근은 해당 기능의 RLS 정책을 따름.

### 예외 처리

| 상황 | 처리 |
|------|------|
| 오프라인 상태 | 네비는 정상 작동, 데이터 로딩 실패 시 각 탭에서 오프라인 안내 |
| 알림 배지 | Insight 탭에 새 리포트가 있으면 빨간 dot 표시 |

---

## COMM-02: 알림

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | COMM-02 |
| 기능명 | 알림 |
| 목적 | 기록 리마인더, AI 리포트 생성 완료 알림으로 재방문 유도 |
| 우선순위 | P2 (Sprint 5) |

### 사용자 스토리

- 부모로서, 나는 매일 저녁 기록을 남기라는 리마인더를 받고 싶다
- 부모로서, 나는 AI 리포트가 생성되면 알림을 받고 싶다
- 부모로서, 나는 알림 시간을 원하는 시간으로 설정하고 싶다

### 입력 / 출력

| 구분 | 내용 |
|------|------|
| 입력 | 알림 설정 (ON/OFF, 시간 설정) |
| 출력 | 푸시 알림 (브라우저 Notification API 또는 PWA), 인앱 알림 목록 |

### UI 요소

| 요소 | 설명 |
|------|------|
| 알림 벨 아이콘 | Home 헤더 우측 🔔, 읽지 않은 알림 시 빨간 dot |
| 알림 목록 페이지 | 시간순 알림 리스트, 읽음/안읽음 구분, 탭하면 해당 페이지 이동 |
| 설정 페이지 | 기록 리마인더 ON/OFF, 리포트 알림 ON/OFF, 알림 시간 설정 |

### 비즈니스 로직

**알림 유형:**

| 알림 유형 | 트리거 | 기본 시간 | 메시지 예시 |
|-----------|--------|-----------|-------------|
| 기록 리마인더 | 오늘 기록이 0건이면 | 사용자 설정 (기본 20:00) | "오늘 윤호의 하루를 기록해보세요 📝" |
| 리포트 완료 | AI 리포트 생성 완료 시 | 생성 즉시 | "윤호의 오늘 하루 요약이 완성되었어요 ✨" |
| 주간 리포트 | 주간 리포트 생성 완료 | 일요일 생성 후 | "이번 주 성장 리포트가 도착했어요 📊" |
| 게임 리마인더 | 3일 연속 게임 미플레이 | 오후 16:00 | "윤호야, 놀이터에서 게임 한 판 하자! 🎮" |

**알림 생성 플로우:**

```
1. FastAPI 스케줄러(cron)가 알림 조건 체크
2. 조건 충족 시 notifications 테이블에 INSERT
3. 브라우저 Push 알림 발송 (Web Push API)
4. 프론트에서 알림 목록 실시간 조회 (Supabase realtime 또는 polling)
```

### Supabase Auth 통합

```
- notifications 테이블의 user_id = auth.uid()
- 알림 설정은 users 테이블의 notification_settings JSONB 컬럼에 저장
```

### RLS 정책

```sql
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
```

### 예외 처리

| 상황 | 처리 |
|------|------|
| 브라우저 알림 권한 거부 | 인앱 알림만 표시, 설정에서 "브라우저 알림을 허용해주세요" 안내 |
| 알림 권한 미요청 (첫 방문) | 첫 기록 작성 후 알림 권한 요청 팝업 (타이밍 중요) |
| 알림 과다 | 같은 유형 알림은 하루 1회로 제한 |

---

## COMM-03: 설정 페이지

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | COMM-03 |
| 기능명 | 설정 페이지 |
| 목적 | 프로필 편집, 가족 관리, 알림 설정, 다크모드, 로그아웃 등 통합 설정 |
| 우선순위 | P2 (Sprint 5) |

### 사용자 스토리

- 부모로서, 나는 아이의 프로필 정보를 수정하고 싶다
- 부모로서, 나는 가족 구성원을 관리하고 권한을 변경하고 싶다
- 부모로서, 나는 알림 시간을 조절하거나 끄고 싶다
- 부모로서, 나는 다크모드를 켜고 끌 수 있으면 좋겠다
- 부모로서, 나는 로그아웃할 수 있어야 한다

### 입력 / 출력

| 구분 | 내용 |
|------|------|
| 입력 | 각 설정 항목 변경 |
| 출력 | 설정 저장 (users 테이블 또는 children 테이블 UPDATE), 즉시 반영 |

### UI 요소

| 섹션 | 항목 |
|------|------|
| 아이 프로필 | 아바타, 이름, 생년월일 (만 나이 자동 표시), "편집" 버튼 |
| 가족 관리 | 가족 구성원 목록 (이름, 역할), "+ 가족 초대" 버튼, 역할 변경 |
| 알림 설정 | 기록 리마인더 토글, 리포트 알림 토글, 알림 시간 선택기 |
| 기타 | 다크모드 토글, 데이터 내보내기, 로그아웃 |

### 비즈니스 로직

**프로필 편집:**

```
1. 아이 프로필 섹션의 "편집" 버튼 클릭
2. 아이 프로필 등록과 동일한 폼 표시 (기존 데이터 pre-fill)
3. 변경 사항 저장: children 테이블 UPDATE
4. 사진 변경 시: 기존 사진 삭제 + 새 사진 업로드
```

**다크모드:**

```
1. 토글 ON/OFF
2. users 테이블의 settings JSONB에 { "dark_mode": true/false } 저장
3. 프론트엔드에서 Tailwind dark: 클래스 활용
4. localStorage에도 캐싱 (로딩 시 깜빡임 방지)
5. 기본값: OS 설정 따름 (prefers-color-scheme)
```

**로그아웃:**

```
1. "로그아웃" 클릭 → 확인 모달 ("정말 로그아웃하시겠습니까?")
2. 확인 시 supabase.auth.signOut() 호출
3. 로컬 캐시/스토리지 클리어
4. 랜딩 페이지로 리다이렉트
```

**데이터 내보내기:**

```
1. "데이터 내보내기" 클릭
2. 해당 아이의 전체 데이터를 JSON으로 export
   - records, reading_logs, play_logs, growth_metrics, ai_reports
3. 파일 다운로드 (child_name_export_yyyymmdd.json)
```

### Supabase Auth 통합

```
- 모든 설정 변경은 auth.uid() 기반으로 권한 확인
- 가족 관리는 admin 역할만 가능 (family_members.role = 'admin')
- 로그아웃 시 Supabase 세션 완전 종료
```

### RLS 정책

```sql
-- users 설정 업데이트
CREATE POLICY "Users can update own settings" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- children 프로필 업데이트 (소유자 + admin)
CREATE POLICY "Owner or admin can update children" ON children
  FOR UPDATE USING (
    user_id = auth.uid()
    OR id IN (
      SELECT child_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### 예외 처리

| 상황 | 처리 |
|------|------|
| 프로필 저장 실패 | "저장에 실패했어요. 다시 시도해주세요." 토스트 |
| 마지막 관리자 삭제 시도 | "관리자가 최소 1명은 있어야 합니다." 안내 |
| 데이터 내보내기 대용량 | 프로그레스 바 표시, 백그라운드 처리 |
| 로그아웃 실패 | 강제 로컬 세션 클리어 후 랜딩 페이지 이동 |

---

## 관련 테이블 종합

| 테이블 | 기능 ID | 주요 필드 |
|--------|---------|-----------|
| `users` | AUTH-01, COMM-03 | id, email, display_name, avatar_url, settings (JSONB), created_at |
| `children` | AUTH-02 | id, user_id, name, birth_date, gender, birth_time, avatar_url, created_at |
| `family_members` | AUTH-03 | id, user_id, child_id, role (admin/editor/viewer), created_at |
| `family_invitations` | AUTH-03 | id, invite_code, child_id, role, created_by, expires_at, used, created_at |
| `notifications` | COMM-02 | id, user_id, type, title, body, is_read, link, created_at |

---

## 전체 우선순위 정리

| 기능 ID | 기능명 | 우선순위 | Sprint | 의존성 |
|---------|--------|----------|--------|--------|
| AUTH-01 | 회원가입/로그인 | P0 | Sprint 1 | Supabase Auth 설정 |
| AUTH-02 | 아이 프로필 등록 | P0 | Sprint 1 | AUTH-01 |
| AUTH-03 | 가족 초대 | P2 | Sprint 5 | AUTH-01, AUTH-02 |
| COMM-01 | 하단 네비게이션 | P0 | Sprint 1 | AUTH-01 |
| COMM-02 | 알림 | P2 | Sprint 5 | AUTH-01, 전체 데이터 |
| COMM-03 | 설정 페이지 | P2 | Sprint 5 | AUTH-01, AUTH-02, AUTH-03 |
