# Yuno920 Architecture and Language Inventory

작성일: 2026-07-15

## 1. 요약

Yuno920은 아동 성장, 기록, 독서, 일정, 놀이, AI 코칭을 제공하는 웹 애플리케이션이다. 저장소는 `frontend`, `backend`, `supabase`로 분리되어 있으며, 프론트엔드는 Next.js 기반 SPA/SSR 애플리케이션, 백엔드는 FastAPI 기반 API 서버, 데이터베이스와 인증은 Supabase가 담당한다.

## 2. 전체 아키텍처

```text
사용자 브라우저
  |
  | HTTPS
  v
Next.js Frontend (Vercel)
  |                         |
  | Supabase JS SDK          | fetch + Bearer access_token
  v                         v
Supabase Auth/DB/Storage   FastAPI Backend (Render)
                            |
                            | service role / API key
                            v
                     Supabase DB + OpenAI API + 외부 공공 API
```

주요 흐름은 다음과 같다.

1. 사용자는 Next.js 프론트엔드에 접속한다.
2. 로그인, 회원가입, OAuth, 세션 관리는 Supabase Auth와 `@supabase/supabase-js`가 처리한다.
3. 일반 데이터 CRUD는 프론트엔드가 Supabase DB에 직접 접근한다. 접근 제어는 Supabase RLS 정책으로 보호한다.
4. AI 분석, 코칭, 퀴즈 생성처럼 서버 키나 OpenAI API가 필요한 기능은 FastAPI 백엔드로 요청한다.
5. 프론트엔드는 Supabase access token을 `Authorization: Bearer ...`로 백엔드에 전달한다.
6. 백엔드는 JWT를 검증하고, Supabase service role key로 데이터 조회/저장 후 OpenAI API 또는 외부 API를 호출한다.

## 3. 구성 언어 및 기술 스택

| 영역 | 언어 | 주요 기술 |
| --- | --- | --- |
| Frontend | TypeScript, TSX, CSS | Next.js 16 App Router, React 19, CSS Modules, Recharts, lucide-react |
| Backend | Python | FastAPI, Uvicorn, Pydantic Settings, httpx, PyJWT |
| Database | SQL / PLpgSQL | Supabase PostgreSQL, RLS, trigger, function, enum, storage bucket |
| AI 연동 | Python | OpenAI Python SDK, `gpt-4o-mini` |
| Infra/Deploy | YAML, Dockerfile | Vercel, Render, Docker |
| Package management | npm, pip | `package-lock.json`, `requirements.txt` |

## 4. 저장소 구조

```text
yuno920/
  frontend/      Next.js 프론트엔드 애플리케이션
  backend/       FastAPI 백엔드 API 서버
  supabase/      DB 마이그레이션 및 seed SQL
  docs/          기획, 설계, API, DB, 기능 문서
  README.md      프로젝트 개요 및 실행 방법
```

## 5. Frontend Architecture

프론트엔드는 `frontend/src/app` 아래의 Next.js App Router 구조를 사용한다.

주요 라우트:

| 경로 | 역할 |
| --- | --- |
| `/` | 랜딩 또는 진입 페이지 |
| `/auth/login`, `/auth/signup`, `/auth/callback` | 인증 화면 및 OAuth callback |
| `/onboarding` | 최초 아동 프로필 등록 |
| `/dashboard` | 대시보드, 날씨, 일정, 독서, 코칭 |
| `/records` | 생활 기록, 상세, 신규 작성, 독서/마일스톤 기록 |
| `/growth` | 성장 지표, 독서 성장, 육각형 역량, 성장 조언 |
| `/insight` | 일일 요약, 주간/월간 리포트, 부모 트렌드 |
| `/activities` | 활동 구성 및 AI 활동 분석 |
| `/chat` | 아동 데이터 기반 AI 챗봇 |
| `/play` | 기억력, 퀴즈, 바둑, 계산, 마인크래프트 관련 놀이 |
| `/settings` | 가족 구성원, 알림 등 설정 |

프론트엔드 계층:

| 계층 | 위치 | 역할 |
| --- | --- | --- |
| Route/Page | `frontend/src/app/**/page.tsx` | 화면 단위 진입점 |
| Layout | `frontend/src/app/layout.tsx`, `(app)/layout.tsx` | 전역 및 인증 후 앱 레이아웃 |
| Components | `frontend/src/components` | UI 컴포넌트, 레이아웃, 부모 관심사 컴포넌트 |
| Hooks | `frontend/src/hooks` | Supabase 데이터 조회/변경 로직 |
| Context | `frontend/src/contexts/AuthContext.tsx` | 인증 상태 관리 |
| Lib | `frontend/src/lib` | Supabase client, API wrapper, auth helper |

프론트엔드 데이터 접근 방식은 두 가지다.

1. Supabase 직접 접근
   - `supabase.from("records")`, `supabase.from("growth_metrics")` 등으로 DB에 직접 CRUD를 수행한다.
   - RLS 정책이 사용자/아동 권한을 제한한다.

2. FastAPI 경유
   - `postWithAuth()`가 Supabase access token을 가져와 백엔드 API에 전달한다.
   - AI, 서버 사이드 검증, 외부 API 통합 기능에 사용된다.

## 6. Backend Architecture

백엔드는 `backend/app` 아래의 FastAPI 애플리케이션이다.

```text
backend/app/
  main.py                 FastAPI 앱 생성, CORS, 라우터 등록
  config.py               환경변수 설정
  auth_deps.py            Supabase JWT 검증 의존성
  dates.py                앱 기준 날짜/타임존 유틸
  routers/
    ai.py                 AI 요약, 코칭, 리포트, 활동 분석, 태깅
    external.py           날씨, 급식 외부 API
    play.py               놀이/퀴즈 생성 API
  services/
    openai_service.py     OpenAI API 호출
    supabase_service.py   Supabase service role 기반 데이터 접근
  models/
    schemas.py            Pydantic request/response schema
```

백엔드 API prefix:

| Prefix | 파일 | 역할 |
| --- | --- | --- |
| `/api/ai` | `routers/ai.py` | AI 챗, 일일 요약, 주간/월간 리포트, 코칭, 성격 분석, 육각형 역량, 성장 조언, 자동 태깅, 활동 분석 |
| `/api/external` | `routers/external.py` | Open-Meteo 날씨, NEIS 급식 정보 |
| `/api/play` | `routers/play.py` | OpenAI 기반 퀴즈 생성 |
| `/health`, `/healthz` | `main.py` | 헬스 체크 |

백엔드 인증 흐름:

1. 프론트엔드가 Supabase access token을 백엔드에 전달한다.
2. `auth_deps.get_current_user_id()`가 `SUPABASE_JWT_SECRET`로 JWT를 검증한다.
3. JWT 검증 실패 시 Supabase Auth `/auth/v1/user`를 통한 fallback 검증을 시도한다.
4. 아동 데이터 접근이 필요한 API는 `SupabaseService.user_has_child_access()`로 `children` 소유자 또는 `family_members` 접근 권한을 확인한다.

## 7. Database Architecture

데이터베이스는 Supabase PostgreSQL이다. `supabase/migrations`에 SQL 마이그레이션이 관리된다.

핵심 테이블:

| 테이블 | 역할 |
| --- | --- |
| `users` | Supabase `auth.users` 확장 프로필 |
| `children` | 아동 프로필 |
| `family_members` | 아동별 가족 권한, `admin/editor/viewer` |
| `schedules` | 일정 |
| `weekly_timetable` | 반복되는 주간 시간표 |
| `records` | 일상 기록 |
| `milestones` | 발달/성장 마일스톤 |
| `reading_logs` | 독서 기록 |
| `growth_metrics` | 키, 몸무게, SR 점수 |
| `hexagon_scores` | 학습, 신체, 사회성, 감정, 창의성, 습관 역량 점수 |
| `play_logs` | 놀이 기록 |
| `ai_reports` | AI 리포트 저장 |
| `notifications` | 알림 설정 |
| `child_activities` | 활동 구성 |
| `activity_assessments` | AI 활동 분석 결과 |

보안 모델:

- Supabase Auth가 사용자 인증을 담당한다.
- 대부분의 테이블에 RLS가 활성화되어 있다.
- `has_child_access`, `has_child_write_access`, `is_child_owner` 같은 DB 함수로 아동별 접근 권한을 제한한다.
- 백엔드는 service role key를 사용하므로, API 레이어에서 JWT 검증과 child access 검증을 수행한다.
- Storage bucket은 `avatars`, `record-photos`, `milestone-photos`로 분리되어 있다.

## 8. AI / External Integration

AI 기능은 백엔드의 `OpenAIService`로 집중되어 있다.

| 기능 | 백엔드 endpoint | 설명 |
| --- | --- | --- |
| 기본 챗 | `POST /api/ai/chat` | 단순 메시지 응답 |
| 데이터 기반 챗 | `POST /api/ai/chat-assistant` | 일정, 기록, 독서, 시간표 context 기반 응답 |
| 일일 요약 | `POST /api/ai/daily-summary` | 당일 기록/독서 기반 요약 |
| 주간/월간 리포트 | `POST /api/ai/weekly-report`, `/monthly-report` | 기간별 AI 리포트 |
| 코칭 | `POST /api/ai/coaching` | 오늘 일정과 최근 기록 기반 코칭 |
| 육각형 역량 | `POST /api/ai/hexagon/calculate` | 성장/기록/독서 기반 역량 점수 산출 |
| 성장 조언 | `POST /api/ai/growth-advice` | 약점 영역 기반 조언 |
| 자동 태깅 | `POST /api/ai/auto-tag` | 기록 내용 카테고리 자동 분류 |
| 활동 분석 | `POST /api/ai/activity-assessment` | 현재 활동 구성의 균형/부하 분석 |
| 퀴즈 생성 | `POST /api/play/generate-quiz` | 선택 카테고리 기반 객관식 퀴즈 생성 |

외부 API:

| 기능 | API |
| --- | --- |
| 날씨 | Open-Meteo forecast API |
| 급식 | NEIS 급식 정보 API |

## 9. Deployment Architecture

프론트엔드:

- Next.js 애플리케이션
- Vercel 배포 전제
- `.vercel` 디렉터리와 Next.js build script 존재
- 주요 환경변수:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL`

백엔드:

- FastAPI 애플리케이션
- Render 배포 설정 존재: `backend/render.yaml`
- Dockerfile 존재: Python 3.12 slim 기반, Uvicorn으로 `app.main:app` 실행
- 주요 환경변수:
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
  - `APP_TIMEZONE`

## 10. Runtime Request Flow Examples

AI 코칭 요청:

```text
Dashboard/Growth/Insight 화면
  -> postWithAuth("/api/ai/coaching", { child_id })
  -> Supabase session에서 access_token 획득
  -> FastAPI Authorization Bearer token 검증
  -> SupabaseService로 child 접근 권한 확인
  -> 최근 일정/기록/독서 조회
  -> OpenAIService.generate_coaching()
  -> JSON 응답 반환
```

기록 저장 및 자동 태깅:

```text
Records 신규 작성 화면
  -> Supabase Storage에 사진 업로드
  -> Supabase records 테이블 insert
  -> postWithAuth("/api/ai/auto-tag", { record_id, content })
  -> 백엔드가 record child_id와 접근 권한 확인
  -> OpenAI로 카테고리 추출
  -> records.categories 업데이트
```

일반 성장 지표 조회/수정:

```text
Growth 화면
  -> useGrowthMetrics hook
  -> Supabase JS SDK로 growth_metrics 직접 조회/insert/update/delete
  -> Supabase RLS가 child 접근 권한 적용
```

## 11. 주요 아키텍처 특징

- 프론트엔드와 백엔드가 명확히 분리된 웹 애플리케이션 구조다.
- 데이터 CRUD의 상당 부분은 Supabase client 직접 접근으로 처리하고, AI/서버 키가 필요한 기능만 FastAPI로 위임한다.
- 인증은 Supabase Auth 중심이며, 백엔드는 Supabase JWT를 검증하는 resource server 역할을 한다.
- 권한 모델은 아동 단위 child access를 기준으로 설계되어 있다.
- PostgreSQL RLS와 FastAPI access check를 함께 사용한다.
- AI prompt와 OpenAI 호출은 `OpenAIService`에 모여 있으나, 일부 prompt 구성은 라우터에도 존재한다.
- CSS는 Tailwind가 README에 언급되어 있으나, 현재 소스 구조상 CSS Modules와 전역 CSS 사용 비중이 높다.

## 12. 확인된 리스크 및 개선 포인트

| 항목 | 내용 |
| --- | --- |
| 문자 인코딩 | 일부 Python 파일과 README의 한글 주석/문구가 깨져 보인다. 소스 인코딩 표준화가 필요하다. |
| API 책임 분리 | 라우터에 prompt 생성 로직이 일부 포함되어 있어, AI domain service로 더 분리할 수 있다. |
| 데이터 접근 방식 혼합 | 프론트 직접 Supabase 접근과 백엔드 접근이 혼재한다. 기능별 기준을 문서화하면 유지보수성이 좋아진다. |
| 테스트 | 백엔드는 OpenAI key 테스트 파일 외 자동화 테스트가 제한적으로 보인다. 핵심 권한/AI endpoint 테스트 보강이 필요하다. |
| 배포 문서 | README에는 backend 배포가 TBD로 남아 있으나 `render.yaml`은 존재한다. README 업데이트가 필요하다. |

## 13. 결론

Yuno920은 TypeScript/Next.js 프론트엔드, Python/FastAPI 백엔드, Supabase PostgreSQL/Auth/Storage를 중심으로 구성된 풀스택 웹 애플리케이션이다. 아키텍처는 Supabase를 인증과 데이터 플랫폼으로 사용하고, FastAPI를 AI 및 외부 연동을 위한 보안 API 계층으로 두는 형태다. 배포는 프론트엔드 Vercel, 백엔드 Render 구성이 현재 저장소 기준의 실제 구조와 가장 일치한다.
