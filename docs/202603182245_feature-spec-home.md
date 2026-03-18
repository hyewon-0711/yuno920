# 기능 정의서: Home (Today Dashboard)

> Yuno920 — AI 기반 아이 성장·육아 통합 플랫폼
> 문서 버전: v1.0 | 작성일: 2026-03-18

---

## 개요

Home 탭은 사용자가 매일 접속해야 하는 이유를 제공하는 핵심 화면이다. 오늘 하루에 필요한 일정, 환경 정보, 독서 현황, AI 코칭을 한 화면에 모아 부모가 아이의 하루를 한눈에 파악할 수 있도록 한다.

**탭 테마 컬러:** Orange `#F97316`

---

## HOME-01: 오늘 일정

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | HOME-01 |
| 기능명 | 오늘 일정 |
| 목적 | 아이의 오늘 학원/학교 일정을 시간순으로 보여주고, 다음 일정까지 남은 시간을 표시하여 하루 스케줄을 관리한다 |
| 우선순위 | **P0** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-HOME-01-01 | As a 부모, I want to 오늘의 학원/학교 일정을 시간순으로 확인하고 싶다, so that 아이의 하루 스케줄을 한눈에 파악할 수 있다 |
| US-HOME-01-02 | As a 부모, I want to 다음 일정까지 남은 시간을 실시간으로 보고 싶다, so that 아이 픽업 등 준비를 놓치지 않는다 |
| US-HOME-01-03 | As a 부모, I want to 일정을 추가/수정/삭제하고 싶다, so that 변경된 스케줄을 즉시 반영할 수 있다 |
| US-HOME-01-04 | As a 부모, I want to 반복 일정을 등록하고 싶다, so that 매주 반복되는 학원 일정을 한 번만 입력하면 된다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| title | string | Y | 일정 제목 | 1~50자 |
| start_time | datetime | Y | 시작 시간 | 오늘 날짜 범위 |
| end_time | datetime | N | 종료 시간 | start_time 이후 |
| location | string | N | 장소명 | 최대 100자 |
| category | enum | N | 분류 (학교/학원/병원/기타) | 기본값: 기타 |
| repeat_type | enum | N | 반복 유형 (없음/매일/매주/매월) | 기본값: 없음 |
| repeat_end_date | date | N | 반복 종료일 | repeat_type이 '없음'이 아닐 때 |
| memo | string | N | 메모 | 최대 200자 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| schedules | array | 오늘 일정 목록 (시간순 정렬) |
| schedules[].title | string | 일정 제목 |
| schedules[].start_time | string | "09:00" 형식 |
| schedules[].end_time | string | "10:00" 형식 (없으면 null) |
| schedules[].category | string | 분류 |
| schedules[].remaining | string | "1시간 후", "30분 후", "진행 중" 등 |
| schedules[].status | enum | upcoming / ongoing / completed |

### UI 요소

```
── 오늘 일정 ─────────────
┌───────────────────────┐
│ 09:00  학교              │   ← 완료 상태: Gray 텍스트
│ 15:00  태권도  (1시간 후) │   ← 다음 일정: Bold + remaining 뱃지
│ 17:00  영어학원          │   ← 예정: 기본 텍스트
│              [+ 일정추가] │   ← 우하단 텍스트 버튼 (Primary 컬러)
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 섹션 타이틀 | "오늘 일정" — H2 (20px, SemiBold) |
| 카드 컨테이너 | 흰색 배경, rounded-xl(12px), shadow-sm, padding 16px |
| 일정 항목 | 시작 시간(좌) + 제목(중) + 남은 시간 뱃지(우) |
| 시간 텍스트 | Caption (12px, Medium), Gray-500 |
| 제목 텍스트 | Body L (16px), Gray-900 |
| 남은 시간 뱃지 | Caption 크기, Primary Light 배경, Primary 텍스트 |
| 완료 항목 | 텍스트 Gray-400, 취소선 |
| 일정 추가 버튼 | Ghost 버튼, `+` 아이콘 + "일정추가" 텍스트 |
| 빈 상태 | "오늘 등록된 일정이 없습니다" + 일정 추가 유도 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-HOME-01-01 | 일정은 오늘(00:00~23:59) 범위만 표시한다 |
| BL-HOME-01-02 | 시간순 오름차순 정렬한다 |
| BL-HOME-01-03 | 현재 시간 기준 종료된 일정은 `completed` 상태로 Gray 처리한다 |
| BL-HOME-01-04 | 현재 진행 중인 일정(start_time ≤ now ≤ end_time)은 `ongoing`으로 Primary 강조 표시한다 |
| BL-HOME-01-05 | 다음 예정 일정에 남은 시간을 실시간(1분 간격) 갱신한다 |
| BL-HOME-01-06 | 남은 시간 표시 규칙: 60분 이상 → "N시간 후", 60분 미만 → "N분 후", 진행 중 → "진행 중" |
| BL-HOME-01-07 | 반복 일정은 repeat_type에 따라 자동 생성하되, 개별 수정/삭제 가능하다 (this occurrence / all occurrences 선택) |
| BL-HOME-01-08 | 일정 최대 표시 수: 10개. 초과 시 "더보기" 링크로 전체 목록 이동한다 |
| BL-HOME-01-09 | 자정이 지나면 자동으로 다음 날 일정으로 갱신한다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 일정 데이터 없음 | 빈 상태 UI 표시: 일러스트 + "오늘 등록된 일정이 없습니다" + [일정 추가] 버튼 |
| 일정 저장 실패 (네트워크) | 토스트: "일정 저장에 실패했습니다. 다시 시도해주세요" + 재시도 버튼 |
| 중복 시간대 일정 등록 | 경고 표시: "같은 시간에 다른 일정이 있습니다. 그래도 추가하시겠습니까?" |
| 과거 시간에 일정 추가 | 허용하되, 자동으로 completed 처리 |
| end_time < start_time | 입력 유효성 검증 실패: "종료 시간은 시작 시간 이후여야 합니다" |
| 반복 일정 대량 삭제 | "이 일정만 삭제" / "이후 모든 일정 삭제" 확인 바텀시트 |

### 관련 테이블

```sql
-- schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title VARCHAR(50) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location VARCHAR(100),
  category VARCHAR(20) DEFAULT 'etc',  -- school, academy, hospital, etc
  repeat_type VARCHAR(10) DEFAULT 'none',  -- none, daily, weekly, monthly
  repeat_group_id UUID,  -- 반복 일정 그룹 식별
  repeat_end_date DATE,
  memo VARCHAR(200),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedules_child_date ON schedules(child_id, start_time);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/schedules?date={YYYY-MM-DD}` | 특정 날짜 일정 목록 조회 |
| POST | `/api/v1/children/{child_id}/schedules` | 일정 생성 |
| PUT | `/api/v1/children/{child_id}/schedules/{id}` | 일정 수정 |
| DELETE | `/api/v1/children/{child_id}/schedules/{id}?scope={this\|all}` | 일정 삭제 (단건/반복 전체) |

---

## HOME-02: 환경 정보

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | HOME-02 |
| 기능명 | 환경 정보 |
| 목적 | 오늘의 날씨, 미세먼지 수준, 학교 급식 메뉴를 표시하여 아이의 하루 준비에 필요한 환경 정보를 한눈에 제공한다 |
| 우선순위 | **P1** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-HOME-02-01 | As a 부모, I want to 오늘의 날씨와 기온을 확인하고 싶다, so that 아이에게 적절한 옷을 입힐 수 있다 |
| US-HOME-02-02 | As a 부모, I want to 미세먼지 상태를 알고 싶다, so that 야외 활동 여부를 결정할 수 있다 |
| US-HOME-02-03 | As a 부모, I want to 오늘 급식 메뉴를 확인하고 싶다, so that 저녁 식단을 계획할 수 있다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| location | object | Y | 사용자 위치 (위도/경도) | 설정에서 지역 수동 설정 가능 |
| school_code | string | N | 학교 급식 조회용 NEIS 코드 | 아이 프로필에서 설정 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| weather.temperature | number | 현재 기온 (°C) |
| weather.condition | string | 날씨 상태 (맑음/흐림/비/눈 등) |
| weather.icon | string | 날씨 아이콘 코드 |
| weather.high | number | 최고 기온 |
| weather.low | number | 최저 기온 |
| dust.pm10 | number | 미세먼지 수치 (μg/m³) |
| dust.pm25 | number | 초미세먼지 수치 |
| dust.grade | enum | 좋음/보통/나쁨/매우나쁨 |
| meal.date | string | 날짜 |
| meal.menu | string[] | 급식 메뉴 목록 |
| meal.calories | number | 총 칼로리 (kcal) |

### UI 요소

```
┌───────────────────────┐
│ 🌤 서울 22° | 미세먼지 좋음│   ← 상단 환경 요약 바
│ 3월 18일 화요일          │
└───────────────────────┘

── 오늘의 급식 ───────────
┌───────────────────────┐
│ 🍚 쌀밥, 된장찌개,       │
│    제육볶음, 김치, 사과   │
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 환경 요약 바 | 카드 최상단 배치, Primary Light 배경 |
| 날씨 아이콘 | 24px, 날씨 상태별 이모지 또는 아이콘 |
| 기온 텍스트 | H3 (18px, Medium) |
| 미세먼지 뱃지 | 상태별 컬러: 좋음(Success), 보통(Warning), 나쁨(Error), 매우나쁨(Error + Bold) |
| 날짜 텍스트 | Body S (14px), Gray-500 |
| 급식 섹션 | 별도 카드, 🍚 이모지 + 메뉴 텍스트(Body S) |
| 급식 미등록 상태 | "급식 정보가 없습니다" Gray-400 텍스트 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-HOME-02-01 | 날씨/미세먼지 데이터는 30분 간격으로 캐싱하여 API 호출 최소화한다 |
| BL-HOME-02-02 | 위치 정보는 아이 프로필의 지역 설정을 우선 사용하고, 미설정 시 GPS를 사용한다 |
| BL-HOME-02-03 | 미세먼지 등급 기준: 좋음(0~30), 보통(31~80), 나쁨(81~150), 매우나쁨(151~) |
| BL-HOME-02-04 | 급식 데이터는 NEIS 오픈 API에서 학교 코드 기준으로 조회한다 |
| BL-HOME-02-05 | 급식 데이터는 매일 06:00에 캐싱한다 (학기 중에만) |
| BL-HOME-02-06 | 주말/공휴일에는 급식 섹션을 숨기고 날씨 정보만 표시한다 |
| BL-HOME-02-07 | 미세먼지 '나쁨' 이상이면 AI 코칭에서 실내 활동 권장 메시지를 포함한다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 날씨 API 실패 | 마지막 캐시 데이터 표시 + "업데이트 실패" 작은 라벨 |
| 위치 정보 없음 | 기본 위치(서울) 사용 + "지역 설정" 유도 링크 |
| 급식 API 실패 | "급식 정보를 불러올 수 없습니다" 표시 |
| 학교 코드 미등록 | "학교를 등록하면 급식 메뉴를 확인할 수 있어요" + 설정 이동 링크 |
| 방학/주말 | 급식 섹션 비노출, 날씨만 표시 |

### 관련 테이블

```sql
-- weather_cache (캐시 테이블)
CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code VARCHAR(20) NOT NULL,
  temperature DECIMAL(4,1),
  condition VARCHAR(20),
  high_temp DECIMAL(4,1),
  low_temp DECIMAL(4,1),
  pm10 INTEGER,
  pm25 INTEGER,
  dust_grade VARCHAR(10),
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_cache_region ON weather_cache(region_code, fetched_at DESC);

-- meal_cache (급식 캐시)
CREATE TABLE meal_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code VARCHAR(20) NOT NULL,
  meal_date DATE NOT NULL,
  menu TEXT[] NOT NULL,
  calories INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_code, meal_date)
);

CREATE INDEX idx_meal_cache_school_date ON meal_cache(school_code, meal_date);

-- children 테이블 확장 필드
-- region_code VARCHAR(20)      -- 지역 코드
-- school_code VARCHAR(20)      -- 학교 NEIS 코드
-- school_name VARCHAR(100)     -- 학교명
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/environment/weather?region={region_code}` | 현재 날씨 + 미세먼지 조회 |
| GET | `/api/v1/environment/meal?school_code={code}&date={YYYY-MM-DD}` | 급식 메뉴 조회 |

### 외부 API 연동

| 서비스 | API | 비고 |
|--------|-----|------|
| 기상청 단기예보 | 공공데이터포털 기상청 API | 날씨/기온 |
| 에어코리아 | 공공데이터포털 미세먼지 API | PM10, PM2.5 |
| NEIS 급식 | 교육부 NEIS 오픈 API | 학교 급식 정보 |

---

## HOME-03: 오늘의 독서

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | HOME-03 |
| 기능명 | 오늘의 독서 |
| 목적 | 오늘의 독서 목표 달성률과 최근 읽은 책 정보를 표시하여 아이의 독서 습관 형성을 돕는다 |
| 우선순위 | **P1** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-HOME-03-01 | As a 부모, I want to 오늘의 독서 목표 대비 달성률을 확인하고 싶다, so that 아이의 독서 습관을 관리할 수 있다 |
| US-HOME-03-02 | As a 부모, I want to 아이가 최근에 읽고 있는 책을 확인하고 싶다, so that 독서 진행 상황을 파악할 수 있다 |
| US-HOME-03-03 | As a 부모, I want to 독서 목표(시간/권수)를 설정하고 싶다, so that 아이의 수준에 맞는 독서량을 관리할 수 있다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| daily_time_goal | integer | N | 일일 독서 목표 시간 (분) | 5~180분, 기본 30분 |
| daily_book_goal | integer | N | 일일 독서 목표 권수 | 1~10권, 기본 1권 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| goal.time_minutes | integer | 목표 시간 (분) |
| goal.book_count | integer | 목표 권수 |
| today.read_minutes | integer | 오늘 읽은 시간 (분) |
| today.read_count | integer | 오늘 읽은 권수 |
| today.progress_percent | number | 달성률 (%) |
| recent_book.title | string | 최근 읽은 책 제목 |
| recent_book.read_date | string | 마지막 읽은 날짜 |
| streak_days | integer | 연속 독서 일수 |

### UI 요소

```
── 오늘의 독서 ───────────
┌───────────────────────┐
│ 📚 목표: 30분 / 1권      │
│ ████████░░░░  20분 달성   │   ← 프로그레스 바
│ 최근: "어린왕자"          │
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 섹션 타이틀 | "오늘의 독서" — H2 (20px, SemiBold) |
| 카드 | 흰색 배경, rounded-xl, shadow-sm, padding 16px |
| 목표 텍스트 | Body S (14px), Gray-500, 📚 이모지 + "목표: {time}분 / {count}권" |
| 프로그레스 바 | 높이 8px, rounded-full, 배경 Gray-100, 채움 Primary(#F97316) |
| 달성 텍스트 | Body S (14px), 프로그레스 바 우측, "{minutes}분 달성" |
| 최근 책 | Body S (14px), Gray-700, "최근: \"{title}\"" |
| 100% 달성 시 | 프로그레스 바 Success(#10B981) + ✅ 아이콘 + "목표 달성!" |
| 연속 독서 뱃지 | streak_days ≥ 3이면 🔥 이모지 + "{N}일 연속 독서 중" |
| 탭 시 동작 | 독서 기록 상세 화면(Record → 독서)으로 이동 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-HOME-03-01 | 오늘(00:00~23:59) 범위의 reading_logs를 합산하여 달성 시간/권수를 계산한다 |
| BL-HOME-03-02 | 목표 미설정 시 기본값: 시간 30분, 권수 1권 |
| BL-HOME-03-03 | 달성률 계산: (읽은 시간 / 목표 시간) × 100, 최대 100%로 cap |
| BL-HOME-03-04 | 최근 책은 가장 마지막에 기록된 reading_log의 책 제목을 표시한다 |
| BL-HOME-03-05 | 연속 독서: 어제를 포함하여 연속으로 독서 기록이 있는 날 수 (오늘 포함) |
| BL-HOME-03-06 | 독서 기록이 전혀 없으면 "오늘 첫 독서를 시작해볼까요?" 유도 메시지를 표시한다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 독서 기록 없음 | 빈 상태: 프로그레스 0% + "오늘 첫 독서를 시작해볼까요?" + 독서 기록 추가 버튼 |
| 목표 미설정 | 기본값(30분/1권) 적용 + "목표를 설정해보세요" 작은 링크 |
| 데이터 로딩 실패 | 스켈레톤 UI → 재시도 버튼 |

### 관련 테이블

```sql
-- reading_logs (기존 테이블)
-- id, child_id, title, category, duration, read_date

-- reading_goals (신규)
CREATE TABLE reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  daily_time_goal INTEGER DEFAULT 30,    -- 분 단위
  daily_book_goal INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id)
);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/reading/today` | 오늘 독서 현황 (달성률, 최근 책, streak) |
| GET | `/api/v1/children/{child_id}/reading/goal` | 독서 목표 조회 |
| PUT | `/api/v1/children/{child_id}/reading/goal` | 독서 목표 설정/수정 |

---

## HOME-04: AI 오늘 코칭

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | HOME-04 |
| 기능명 | AI 오늘 코칭 |
| 목적 | 오늘의 날씨, 일정, 아이의 최근 기록 데이터를 기반으로 AI가 맞춤형 하루 행동 가이드와 부모 대화 추천을 제공한다 |
| 우선순위 | **P0** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-HOME-04-01 | As a 부모, I want to 오늘 아이와 어떤 활동을 하면 좋을지 AI 추천을 받고 싶다, so that 하루를 알차게 보낼 수 있다 |
| US-HOME-04-02 | As a 부모, I want to 아이와 나눌 대화 주제를 추천받고 싶다, so that 아이와의 소통을 더 잘할 수 있다 |
| US-HOME-04-03 | As a 부모, I want to AI 코칭이 오늘의 상황(날씨, 일정 등)을 반영하길 원한다, so that 실용적인 조언을 받을 수 있다 |

### 입력 데이터 (AI 컨텍스트)

| 필드 | 타입 | 설명 |
|------|------|------|
| child_profile | object | 이름, 나이, 성별 |
| today_weather | object | 날씨, 기온, 미세먼지 |
| today_schedules | array | 오늘 일정 목록 |
| recent_records | array | 최근 3일 기록 (감정, 카테고리) |
| recent_reading | object | 최근 독서 현황 |
| growth_metrics | object | 최근 6각형 인재 분석 점수 |
| yesterday_coaching | object | 어제 코칭 내용 (중복 방지) |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| coaching_id | string | 코칭 고유 ID |
| greeting | string | 인사/상황 요약 (1~2문장) |
| activity_guide | string | 활동 추천 (1~2문장) |
| conversation_tip | string | 대화 추천 (1~2문장) |
| generated_at | datetime | 생성 시간 |

### UI 요소

```
── AI 오늘 코칭 ──────────
┌───────────────────────┐
│ ✨ "오늘은 야외 활동하기  │   ← Info 컬러(#6366F1) 배경 tint
│    좋은 날씨예요.         │
│    저녁에 독서 시간을     │
│    가져보면 어떨까요?"    │
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 섹션 타이틀 | "AI 오늘 코칭" — H2 (20px, SemiBold) + ✨ Sparkles 아이콘 |
| 카드 | Info Light 배경(#EEF2FF), rounded-xl, padding 16px, border Info(#6366F1) 0.5px |
| 코칭 텍스트 | Body L (16px), Gray-900, 이탤릭 스타일 |
| ✨ 아이콘 | Sparkles(Lucide), Info 컬러, 좌상단 |
| 로딩 상태 | 스켈레톤 + "AI가 오늘 코칭을 준비하고 있어요..." 텍스트 |
| 탭 시 동작 | Insight 탭의 상세 코칭 화면으로 이동 |
| 새로고침 | 카드 우상단 RefreshCw 아이콘 버튼 (수동 재생성, 일 3회 제한) |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-HOME-04-01 | 코칭은 매일 첫 접속 시 자동 생성한다 (이미 생성된 경우 캐시 사용) |
| BL-HOME-04-02 | AI 프롬프트에 오늘 날씨, 일정, 최근 기록, 독서 현황, 성장 데이터를 컨텍스트로 포함한다 |
| BL-HOME-04-03 | 미세먼지 '나쁨' 이상이면 실내 활동을 추천한다 |
| BL-HOME-04-04 | 최근 감정이 '안좋음' 또는 '아픔'이면 케어 중심 코칭을 제공한다 |
| BL-HOME-04-05 | 어제 코칭과 중복되지 않도록 yesterday_coaching을 참조한다 |
| BL-HOME-04-06 | 코칭 텍스트 길이: 최대 150자 (greeting + activity_guide + conversation_tip 합산) |
| BL-HOME-04-07 | 수동 새로고침은 1일 3회로 제한한다 (무료 플랜 기준) |
| BL-HOME-04-08 | AI 응답 시간 목표: 5초 이내. 초과 시 이전 캐시 표시 + 백그라운드 갱신 |
| BL-HOME-04-09 | 코칭 생성 시 사용한 컨텍스트 데이터를 ai_reports 테이블에 함께 저장한다 |
| BL-HOME-04-10 | 존댓말(~요 체) 사용, 아이 이름 포함, 따뜻하고 구체적인 톤 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| AI 생성 실패 | 기본 코칭 메시지 표시: "오늘도 {아이이름}와(과) 행복한 하루 보내세요!" |
| AI 응답 타임아웃 (>10초) | 이전 캐시 표시 + 백그라운드 재시도 |
| 컨텍스트 데이터 부족 (신규 사용자) | 날씨 기반 일반 코칭: "오늘은 {날씨} 날씨예요. 좋은 하루 보내세요!" |
| 일일 새로고침 한도 초과 | 토스트: "오늘 AI 코칭 새로고침 횟수를 모두 사용했습니다" |
| 부적절한 AI 응답 | 콘텐츠 필터링 후 기본 메시지 대체 |

### 관련 테이블

```sql
-- ai_reports 테이블 (기존) 활용
-- type = 'daily_coaching'
--
-- ai_reports
-- id, child_id, type, content(JSONB), created_at

-- ai_coaching_cache (당일 캐시)
CREATE TABLE ai_coaching_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  coaching_date DATE NOT NULL,
  greeting TEXT NOT NULL,
  activity_guide TEXT NOT NULL,
  conversation_tip TEXT NOT NULL,
  context_data JSONB,
  refresh_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, coaching_date)
);

CREATE INDEX idx_coaching_cache_child_date ON ai_coaching_cache(child_id, coaching_date);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/coaching/today` | 오늘 AI 코칭 조회 (없으면 자동 생성) |
| POST | `/api/v1/children/{child_id}/coaching/refresh` | AI 코칭 수동 재생성 (일 3회 제한) |

---

## Home 화면 통합 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/home/today` | Home 화면 전체 데이터 통합 조회 (일정 + 환경 + 독서 + 코칭) |

통합 API 응답 구조:

```json
{
  "child": { "name": "윤호", "avatar_url": "..." },
  "date": "2026-03-18",
  "weather": { "temperature": 22, "condition": "맑음", "dust_grade": "좋음" },
  "schedules": [ ... ],
  "reading": { "goal": { ... }, "today": { ... }, "recent_book": { ... } },
  "coaching": { "greeting": "...", "activity_guide": "...", "conversation_tip": "..." },
  "meal": { "menu": ["쌀밥", "된장찌개", ...] }
}
```

> 클라이언트는 통합 API 1회 호출로 Home 화면을 렌더링하되, 개별 섹션의 새로고침은 개별 API를 사용한다.
