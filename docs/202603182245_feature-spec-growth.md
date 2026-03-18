# 기능 정의서: Growth (성장)

> Yuno920 — AI 기반 아이 성장·육아 통합 플랫폼
> 문서 버전: v1.0 | 작성일: 2026-03-18

---

## 개요

Growth 탭은 아이의 신체, 학습, 독서, 다면적 역량 데이터를 시각화하여 부모가 데이터 기반으로 아이의 성장 상태를 파악하고, AI가 부족 영역을 진단해 개선 방안을 제안하는 화면이다.

**탭 테마 컬러:** Green `#10B981`

---

## GROW-01: 신체 성장

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | GROW-01 |
| 기능명 | 신체 성장 |
| 목적 | 아이의 키/몸무게를 주기적으로 기록하고, 시간별 추이 그래프와 또래 비교 데이터를 제공하여 신체 성장 상태를 객관적으로 파악한다 |
| 우선순위 | **P0** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-GROW-01-01 | As a 부모, I want to 아이의 키와 몸무게를 기록하고 싶다, so that 성장 변화를 추적할 수 있다 |
| US-GROW-01-02 | As a 부모, I want to 키/몸무게 변화를 그래프로 보고 싶다, so that 성장 추세를 한눈에 파악할 수 있다 |
| US-GROW-01-03 | As a 부모, I want to 같은 나이 또래와 비교하고 싶다, so that 아이의 성장이 정상 범위인지 확인할 수 있다 |
| US-GROW-01-04 | As a 부모, I want to 성장 기록 이력을 확인하고 싶다, so that 과거 데이터를 참고할 수 있다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| height | decimal(5,1) | Y | 키 (cm) | 50.0~200.0 |
| weight | decimal(4,1) | Y | 몸무게 (kg) | 5.0~100.0 |
| recorded_at | date | Y | 측정일 | 오늘 이전 날짜 |
| memo | string | N | 메모 (병원 방문 등) | 최대 200자 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| latest.height | decimal | 가장 최근 키 (cm) |
| latest.weight | decimal | 가장 최근 몸무게 (kg) |
| latest.bmi | decimal | BMI (소수 1자리) |
| latest.recorded_at | date | 최근 측정일 |
| chart_data | array | 그래프용 데이터 [{date, height, weight}] |
| percentile.height | integer | 키 백분위수 (동일 성별/연령 기준) |
| percentile.weight | integer | 몸무게 백분위수 |
| percentile.reference | string | 비교 기준 설명 ("만 7세 남아 기준") |
| growth_rate.height | decimal | 최근 3개월 키 변화량 (cm) |
| growth_rate.weight | decimal | 최근 3개월 몸무게 변화량 (kg) |

### UI 요소

```
── 신체 성장 ─────────────
┌───────────────────────┐
│  키: 128.5cm  몸무게: 27kg│
│  ┌─────────────────┐   │
│  │   [꺾은선 그래프]  │   │   ← 기간 토글: 6개월/1년/전체
│  │   키/몸무게 추이   │   │   ← 이중 Y축 (키 좌, 몸무게 우)
│  └─────────────────┘   │
│  📊 또래 비교: 상위 35%   │   ← 백분위 뱃지
│              [+ 입력]   │
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 섹션 타이틀 | "신체 성장" — H2 (20px, SemiBold) |
| 현재 수치 | 키/몸무게 — H3 (18px, Medium), Growth 테마 컬러 |
| 꺾은선 그래프 | 높이 200px, 이중 Y축, 키(Green) + 몸무게(Secondary Blue) |
| 기간 필터 | 세그먼트 컨트롤: 6개월 / 1년 / 전체 |
| 또래 비교 뱃지 | Success 배경, "또래 비교: 상위 {N}%" |
| 입력 버튼 | Ghost 버튼, `+` 아이콘 + "입력" |
| 입력 바텀시트 | 키/몸무게 숫자 입력 + 날짜 선택 + 메모 |
| 이력 보기 | "기록 이력 >" 텍스트 링크 → 전체 이력 화면 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-GROW-01-01 | 그래프는 기본 6개월 범위로 표시하며, 1년/전체 전환 가능하다 |
| BL-GROW-01-02 | 꺾은선 그래프는 이중 Y축: 좌측(키, cm), 우측(몸무게, kg) |
| BL-GROW-01-03 | 또래 비교 백분위는 질병관리청 소아청소년 성장도표 기준으로 계산한다 |
| BL-GROW-01-04 | BMI = 몸무게(kg) / (키(m))², 소수점 1자리 반올림 |
| BL-GROW-01-05 | 같은 날짜에 중복 입력 시 기존 기록을 덮어쓴다 (확인 팝업 표시) |
| BL-GROW-01-06 | 키 입력 시 이전 기록 대비 ±10cm 이상 차이나면 경고: "입력값을 확인해주세요" |
| BL-GROW-01-07 | 몸무게 입력 시 이전 기록 대비 ±5kg 이상 차이나면 경고 |
| BL-GROW-01-08 | 3개월 이상 미입력 시 Home 화면에 "성장 기록을 업데이트해주세요" 리마인더 |
| BL-GROW-01-09 | 그래프 데이터 포인트가 2개 미만이면 그래프 대신 "기록을 더 추가하면 그래프를 볼 수 있어요" 표시 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 기록 없음 | 빈 상태: 일러스트 + "아이의 키와 몸무게를 기록해보세요" + [첫 기록 추가] 버튼 |
| 비정상 수치 입력 | 유효성 검증 실패 메시지: "키는 50~200cm 범위로 입력해주세요" |
| 기록 1건만 존재 | 그래프 대신 단일 데이터 카드 + "기록을 더 추가하면 변화 추이를 볼 수 있어요" |
| 또래 비교 데이터 불일치 (매우 저/고연령) | 비교 불가 메시지: "해당 연령의 비교 데이터가 없습니다" |
| 저장 실패 | 토스트: "저장에 실패했습니다. 다시 시도해주세요" |

### 관련 테이블

```sql
-- growth_metrics (확장)
CREATE TABLE growth_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  height DECIMAL(5,1),          -- cm
  weight DECIMAL(4,1),          -- kg
  bmi DECIMAL(4,1),             -- 자동 계산
  memo VARCHAR(200),
  recorded_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, recorded_at)
);

CREATE INDEX idx_growth_child_date ON growth_metrics(child_id, recorded_at DESC);

-- growth_percentile_reference (또래 비교 참조 데이터)
CREATE TABLE growth_percentile_reference (
  id SERIAL PRIMARY KEY,
  gender VARCHAR(1) NOT NULL,         -- M/F
  age_months INTEGER NOT NULL,        -- 월령
  metric_type VARCHAR(10) NOT NULL,   -- height/weight/bmi
  p3 DECIMAL(5,1),
  p10 DECIMAL(5,1),
  p25 DECIMAL(5,1),
  p50 DECIMAL(5,1),
  p75 DECIMAL(5,1),
  p90 DECIMAL(5,1),
  p97 DECIMAL(5,1),
  UNIQUE(gender, age_months, metric_type)
);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/growth?period={6m\|1y\|all}` | 신체 성장 데이터 조회 (그래프 + 최신 + 백분위) |
| POST | `/api/v1/children/{child_id}/growth` | 신체 기록 추가 |
| PUT | `/api/v1/children/{child_id}/growth/{id}` | 신체 기록 수정 |
| DELETE | `/api/v1/children/{child_id}/growth/{id}` | 신체 기록 삭제 |
| GET | `/api/v1/children/{child_id}/growth/history` | 전체 기록 이력 (페이지네이션) |

---

## GROW-02: 학습 지표

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | GROW-02 |
| 기능명 | 학습 지표 |
| 목적 | SR(Scholastic Reading) 점수를 포함한 학습 지표의 시간별 추이를 시각화하여 아이의 학습 성장을 추적한다 |
| 우선순위 | **P1** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-GROW-02-01 | As a 부모, I want to 아이의 SR 점수 변화를 그래프로 보고 싶다, so that 학습 성장 추세를 파악할 수 있다 |
| US-GROW-02-02 | As a 부모, I want to SR 점수를 주기적으로 기록하고 싶다, so that 학습 데이터를 축적할 수 있다 |
| US-GROW-02-03 | As a 부모, I want to 학습 지표가 어느 수준인지 알고 싶다, so that 아이의 학습 수준을 객관적으로 이해할 수 있다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| sr_score | decimal(4,1) | Y | SR 점수 | 0.0~13.0 (학년 수준) |
| test_date | date | Y | 시험/측정일 | 오늘 이전 |
| test_type | enum | N | 시험 유형 (정기/모의/자체) | 기본값: 자체 |
| memo | string | N | 메모 | 최대 200자 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| latest_score | decimal | 최근 SR 점수 |
| latest_date | date | 최근 측정일 |
| grade_level | string | 해당 학년 수준 설명 ("초등 3학년 수준") |
| chart_data | array | 막대 그래프용 [{date, score}] |
| trend | enum | rising / stable / declining |
| improvement | decimal | 최근 3개월 점수 변화량 |

### UI 요소

```
── 학습 지표 ─────────────
┌───────────────────────┐
│  SR 점수 추이            │
│  최근: 3.5 (초3 수준)    │   ← 현재 점수 + 학년 수준 표시
│  ┌─────────────────┐   │
│  │   [막대 그래프]    │   │   ← 세로 막대, 월별/분기별
│  │   월별 SR 점수     │   │
│  └─────────────────┘   │
│  📈 3개월 전 대비 +0.8   │   ← 변화량 표시 (상승: 녹색, 하락: 빨강)
│              [+ 입력]   │
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 섹션 타이틀 | "학습 지표" — H2 |
| 현재 점수 | H3 (18px, Medium), Growth 컬러 |
| 학년 수준 뱃지 | Caption, Gray-500 |
| 막대 그래프 | 높이 180px, 세로 막대, Growth 컬러(#10B981) |
| 변화량 | trend가 rising이면 Success 컬러 + 📈, declining이면 Error 컬러 + 📉 |
| 입력 버튼 | Ghost 버튼 |
| 입력 바텀시트 | SR 점수 숫자 입력 + 날짜 + 시험 유형 선택 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-GROW-02-01 | SR 점수는 소수 1자리까지 입력 가능하다 (예: 3.5) |
| BL-GROW-02-02 | 학년 수준 매핑: 1.0~1.9 → 초1, 2.0~2.9 → 초2, ..., 6.0~6.9 → 초6, 7.0+ → 중등 수준 |
| BL-GROW-02-03 | 막대 그래프는 최근 6개 기록을 표시하며, 더보기로 전체 조회한다 |
| BL-GROW-02-04 | trend 계산: 최근 3건 점수 평균 vs 이전 3건 평균 비교 (상승/유지/하락) |
| BL-GROW-02-05 | 변화량은 가장 최근 기록과 3개월 전 기록의 차이로 계산한다 |
| BL-GROW-02-06 | 기록이 2건 미만이면 trend 및 변화량을 표시하지 않는다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 기록 없음 | 빈 상태: "SR 점수를 기록하면 학습 성장을 추적할 수 있어요" + [첫 기록 추가] |
| 비정상 점수 (13.0 초과) | 유효성 검증: "SR 점수는 0.0~13.0 범위입니다" |
| 동일 날짜 중복 | 덮어쓰기 확인: "이미 해당 날짜에 기록이 있습니다. 수정하시겠습니까?" |

### 관련 테이블

```sql
-- sr_scores (신규)
CREATE TABLE sr_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  sr_score DECIMAL(4,1) NOT NULL,
  test_date DATE NOT NULL,
  test_type VARCHAR(10) DEFAULT 'self',  -- regular, mock, self
  memo VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, test_date)
);

CREATE INDEX idx_sr_scores_child_date ON sr_scores(child_id, test_date DESC);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/sr-scores?limit={N}` | SR 점수 이력 조회 |
| POST | `/api/v1/children/{child_id}/sr-scores` | SR 점수 기록 추가 |
| PUT | `/api/v1/children/{child_id}/sr-scores/{id}` | SR 점수 수정 |
| DELETE | `/api/v1/children/{child_id}/sr-scores/{id}` | SR 점수 삭제 |

---

## GROW-03: 6각형 인재 분석

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | GROW-03 |
| 기능명 | 6각형 인재 분석 |
| 목적 | 학습, 신체, 사회성, 감정, 창의성, 습관 6개 영역의 역량을 레이더 차트로 시각화하여 아이의 균형 잡힌 성장을 돕는다 |
| 우선순위 | **P0** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-GROW-03-01 | As a 부모, I want to 아이의 다면적 역량을 한눈에 보고 싶다, so that 어느 영역이 강하고 부족한지 파악할 수 있다 |
| US-GROW-03-02 | As a 부모, I want to 월별 역량 변화를 비교하고 싶다, so that 성장 방향을 확인할 수 있다 |
| US-GROW-03-03 | As a 부모, I want to 각 영역의 세부 점수와 근거를 알고 싶다, so that AI 분석을 신뢰할 수 있다 |

### 입력 데이터 (AI 자동 산출)

> 이 기능의 점수는 사용자가 직접 입력하지 않고, 아래 데이터 소스에서 AI가 자동 산출한다.

| 영역 | 데이터 소스 | 산출 기준 |
|------|-----------|----------|
| 학습 | sr_scores, play_logs(계산게임), reading_logs | SR 점수 + 게임 성적 + 독서량 종합 |
| 신체 | growth_metrics, records(신체 카테고리) | 성장 추이 + 신체 활동 기록 빈도 |
| 사회성 | records(감정/학교 카테고리), play_logs | 또래 관련 기록 빈도 + 긍정적 사회 활동 |
| 감정 | records(감정 데이터), ai_reports | 감정 분포 + 감정 안정성 추이 |
| 창의성 | records(놀이/창작 카테고리), play_logs | 창의적 활동 기록 + 독서 다양성 |
| 습관 | schedules(일정 이행), reading_logs(연속 독서), records(기록 빈도) | 규칙적 활동 + 목표 달성률 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| scores | object | 6개 영역 점수 |
| scores.learning | integer | 학습 (0~100) |
| scores.physical | integer | 신체 (0~100) |
| scores.social | integer | 사회성 (0~100) |
| scores.emotional | integer | 감정 (0~100) |
| scores.creativity | integer | 창의성 (0~100) |
| scores.habit | integer | 습관 (0~100) |
| overall_score | integer | 종합 점수 (6개 평균) |
| analysis_text | string | AI 분석 코멘트 |
| comparison | object | 이전 월 대비 변화 (영역별 +/-) |
| calculated_at | datetime | 산출 시점 |

### UI 요소

```
── 6각형 인재 분석 ────────
┌───────────────────────┐
│         학습(75)        │
│        /    \          │
│     습관     신체       │   ← 레이더(육각형) 차트
│    (80)  ●  (70)       │       현재 월: Primary 컬러, 채움
│     창의성    사회성     │       이전 월: Gray-300, 점선
│        \    /          │
│         감정(85)        │
│                        │
│  AI: "창의성 영역이      │
│  빠르게 성장하고 있어요"  │   ← AI 분석 코멘트
│                        │
│  [이번 달]  [비교보기]   │   ← 탭 토글
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 섹션 타이틀 | "6각형 인재 분석" — H2 |
| 레이더 차트 | 높이 250px, 6축, 0~100 스케일, 3단계 가이드라인 |
| 현재 월 영역 | Growth 컬러(#10B981) 채움(opacity 0.3) + 실선 |
| 이전 월 영역 | Gray-300 채움(opacity 0.15) + 점선 (비교보기 활성 시) |
| 꼭짓점 라벨 | Caption (12px), 영역명 + 점수 |
| AI 코멘트 | Body S (14px), Info 배경 카드 |
| 탭 토글 | "이번 달" / "비교보기" 세그먼트 컨트롤 |
| 영역 탭 시 | 해당 영역 세부 점수 근거 바텀시트 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-GROW-03-01 | 6각형 점수는 매월 1일에 자동 재산출한다 (이전 30일 데이터 기반) |
| BL-GROW-03-02 | 각 영역 점수는 0~100 정수로 표현한다 |
| BL-GROW-03-03 | 데이터가 부족한 영역(관련 기록 3건 미만)은 기본값 50으로 표시하고, "데이터 부족" 라벨 추가 |
| BL-GROW-03-04 | AI 코멘트는 가장 크게 상승한 영역 또는 가장 높은 영역을 중심으로 생성한다 |
| BL-GROW-03-05 | 비교보기는 이전 달 점수를 중첩 표시하며, 각 영역별 변화량(+/-)을 꼭짓점 아래에 표시한다 |
| BL-GROW-03-06 | 종합 점수 = 6개 영역 점수의 단순 평균 (소수점 반올림) |
| BL-GROW-03-07 | 첫 달(가입 후 30일 미만)에는 "데이터를 모으고 있어요. 기록이 쌓이면 분석 결과를 보여드릴게요" 표시 |
| BL-GROW-03-08 | 영역 탭 시 세부 근거(어떤 데이터에서 점수가 산출되었는지) 바텀시트 표시 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 전체 데이터 없음 (신규 사용자) | 빈 레이더 차트 + "기록을 시작하면 아이의 다면적 역량을 분석해드려요" |
| 일부 영역 데이터 부족 | 해당 영역 기본값(50) + 점선 처리 + "데이터 부족" 회색 라벨 |
| AI 분석 생성 실패 | 코멘트 영역 숨김, 점수만 표시 |
| 비교 대상 없음 (첫 달) | 비교보기 비활성 + "다음 달부터 비교가 가능해요" 툴팁 |

### 관련 테이블

```sql
-- hexagon_scores (월별 6각형 점수)
CREATE TABLE hexagon_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,       -- "2026-03" 형식
  learning INTEGER NOT NULL DEFAULT 50,
  physical INTEGER NOT NULL DEFAULT 50,
  social INTEGER NOT NULL DEFAULT 50,
  emotional INTEGER NOT NULL DEFAULT 50,
  creativity INTEGER NOT NULL DEFAULT 50,
  habit INTEGER NOT NULL DEFAULT 50,
  overall_score INTEGER NOT NULL DEFAULT 50,
  analysis_text TEXT,
  context_data JSONB,                   -- 산출 근거 데이터
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, year_month)
);

CREATE INDEX idx_hexagon_child_month ON hexagon_scores(child_id, year_month DESC);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/hexagon?month={YYYY-MM}` | 특정 월 6각형 점수 조회 |
| GET | `/api/v1/children/{child_id}/hexagon/compare?month1={}&month2={}` | 두 달 비교 조회 |
| GET | `/api/v1/children/{child_id}/hexagon/{area}/detail` | 특정 영역 세부 근거 조회 |

---

## GROW-04: 독서 성장

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | GROW-04 |
| 기능명 | 독서 성장 |
| 목적 | 월별 독서량 추이와 분야별 분포를 시각화하여 아이의 독서 습관 형성과 독서 다양성을 파악한다 |
| 우선순위 | **P1** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-GROW-04-01 | As a 부모, I want to 이번 달 독서량과 목표 달성률을 보고 싶다, so that 독서 습관을 관리할 수 있다 |
| US-GROW-04-02 | As a 부모, I want to 아이가 어떤 분야의 책을 주로 읽는지 보고 싶다, so that 독서 편중을 파악하고 다양한 독서를 유도할 수 있다 |
| US-GROW-04-03 | As a 부모, I want to 월별 독서량 변화를 그래프로 보고 싶다, so that 장기적 독서 습관을 확인할 수 있다 |

### 입력 데이터

> reading_logs 테이블에서 자동 집계 (Record 탭에서 기록).

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| current_month.count | integer | 이번 달 읽은 권수 |
| current_month.goal | integer | 이번 달 목표 권수 |
| current_month.total_minutes | integer | 이번 달 총 독서 시간 (분) |
| monthly_chart | array | 월별 독서량 [{month, count}] |
| category_distribution | array | 분야별 분포 [{category, count, percent}] |
| favorite_category | string | 가장 많이 읽은 분야 |
| diversity_score | integer | 독서 다양성 점수 (0~100) |

### UI 요소

```
── 독서 성장 ─────────────
┌───────────────────────┐
│  이번달: 8권 / 목표 10권  │   ← 텍스트 + 미니 프로그레스 바
│  ┌─────────────────┐   │
│  │  [분야별 도넛 차트] │   │   ← 카테고리별 컬러
│  │  과학 35%          │   │
│  │  동화 30%          │   │
│  │  역사 20%          │   │
│  │  기타 15%          │   │
│  └─────────────────┘   │
│                        │
│  📊 월별 추이 ──────────│
│  [미니 막대 그래프]       │   ← 최근 6개월
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 월간 달성 | Body L, "이번달: {N}권 / 목표 {N}권" + 프로그레스 바 |
| 도넛 차트 | 높이 200px, 카테고리별 컬러, 중앙에 총 권수 표시 |
| 카테고리 범례 | 차트 하단, 컬러 점 + 카테고리명 + 퍼센트 |
| 월별 막대 그래프 | 높이 120px, 최근 6개월, Growth 컬러 |
| 목표 라인 | 막대 그래프에 점선 가이드라인으로 목표 권수 표시 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-GROW-04-01 | 독서 권수 집계: reading_logs에서 해당 월의 고유 책 제목 수로 카운트한다 |
| BL-GROW-04-02 | 같은 책을 여러 번 읽어도 권수는 1권으로 카운트한다 (시간은 합산) |
| BL-GROW-04-03 | 카테고리 분류: 과학, 동화, 역사, 수학, 사회, 예술, 영어, 기타 |
| BL-GROW-04-04 | 월간 목표는 reading_goals 테이블의 monthly_book_goal 사용 (기본값 10권) |
| BL-GROW-04-05 | 다양성 점수: 카테고리 분포의 엔트로피 기반, 균등 분포일수록 높은 점수 |
| BL-GROW-04-06 | 도넛 차트에서 5% 미만 카테고리는 "기타"로 합산한다 |
| BL-GROW-04-07 | 월별 추이 그래프는 최근 6개월을 표시한다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 이번 달 독서 기록 없음 | "이번 달 첫 독서를 기록해보세요" + Record 탭 이동 버튼 |
| 카테고리 미분류 책 | "기타" 카테고리로 자동 분류 |
| 6개월 미만 데이터 | 있는 만큼만 그래프 표시 |

### 관련 테이블

```sql
-- reading_logs (기존 테이블 활용)
-- id, child_id, title, category, duration, read_date

-- reading_goals 확장
ALTER TABLE reading_goals ADD COLUMN monthly_book_goal INTEGER DEFAULT 10;
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/reading/growth?months={N}` | 독서 성장 데이터 (월별 추이 + 분포) |
| GET | `/api/v1/children/{child_id}/reading/distribution?month={YYYY-MM}` | 특정 월 분야별 분포 |

---

## GROW-05: AI 부족 영역 분석

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | GROW-05 |
| 기능명 | AI 부족 영역 분석 |
| 목적 | 6각형 인재 분석 데이터를 기반으로 AI가 부족한 영역을 진단하고, 구체적인 개선 활동을 제안한다 |
| 우선순위 | **P1** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-GROW-05-01 | As a 부모, I want to 아이의 부족한 영역이 무엇인지 AI 진단을 받고 싶다, so that 어느 부분을 더 신경 써야 하는지 알 수 있다 |
| US-GROW-05-02 | As a 부모, I want to 부족 영역 개선을 위한 구체적인 활동 제안을 받고 싶다, so that 바로 실천할 수 있다 |
| US-GROW-05-03 | As a 부모, I want to 이전 진단 대비 개선 여부를 확인하고 싶다, so that 노력의 성과를 느낄 수 있다 |

### 입력 데이터 (AI 컨텍스트)

| 필드 | 타입 | 설명 |
|------|------|------|
| hexagon_scores | object | 현재 월 6각형 점수 |
| previous_scores | object | 이전 월 6각형 점수 |
| recent_records | array | 최근 30일 기록 (카테고리, 빈도) |
| child_profile | object | 나이, 성별 |
| previous_suggestions | array | 이전 개선 제안 (중복 방지) |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| weak_areas | array | 부족 영역 목록 (최대 3개) |
| weak_areas[].area | string | 영역명 |
| weak_areas[].score | integer | 현재 점수 |
| weak_areas[].reason | string | 부족 원인 분석 (1~2문장) |
| suggestions | array | 개선 활동 제안 (영역별 2~3개) |
| suggestions[].area | string | 대상 영역 |
| suggestions[].title | string | 활동 제목 |
| suggestions[].description | string | 활동 설명 (1~2문장) |
| suggestions[].difficulty | enum | easy / medium / hard |
| suggestions[].estimated_time | string | 예상 소요 시간 ("15분", "30분" 등) |
| improvements | array | 이전 대비 개선된 영역 [{area, change}] |

### UI 요소

```
── AI 부족 영역 분석 ──────
┌───────────────────────┐
│ 🔍 진단 결과              │
│                        │
│ ⚠️ 사회성 (45점)         │   ← 부족 영역 카드
│   "또래 관련 기록이 적어요"│
│                        │
│ 💡 개선 제안              │
│ ┌─────────────────────┐│
│ │ 1. 친구와 놀이 시간   ││   ← 제안 카드 리스트
│ │    🟢 쉬움 | 30분     ││
│ ├─────────────────────┤│
│ │ 2. 사회성 독서 추천   ││
│ │    🟡 보통 | 20분     ││
│ └─────────────────────┘│
│                        │
│ ✅ 개선 영역: 창의성 +12  │   ← 개선된 영역 축하
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 진단 결과 카드 | Warning 배경(#FEF3C7), 부족 영역명 + 점수 + 원인 |
| 영역 점수 뱃지 | 점수별 컬러: 0~39 Error, 40~59 Warning, 60~79 Info, 80~100 Success |
| 제안 리스트 | 순번 + 활동 제목 + 난이도 뱃지 + 예상 시간 |
| 난이도 뱃지 | easy(🟢), medium(🟡), hard(🔴) |
| 개선 축하 | 이전 대비 10점 이상 상승한 영역에 Success 배경 + ✅ + 변화량 |
| 재분석 버튼 | "다시 분석하기" — 월 1회만 가능 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-GROW-05-01 | 부족 영역은 6개 영역 중 점수가 낮은 순으로 최대 3개를 선정한다 |
| BL-GROW-05-02 | 점수가 60 미만인 영역만 "부족"으로 판정한다 (모두 60 이상이면 "균형 잡힌 성장" 메시지) |
| BL-GROW-05-03 | 개선 제안은 영역당 2~3개, 총 최대 9개를 생성한다 |
| BL-GROW-05-04 | 제안은 아이의 나이와 수준에 적합한 내용으로 생성한다 |
| BL-GROW-05-05 | 이전 월 제안과 70% 이상 유사한 내용은 제외하고 새로운 제안을 생성한다 |
| BL-GROW-05-06 | 이전 월 대비 10점 이상 상승한 영역은 "개선 영역"으로 축하 메시지를 표시한다 |
| BL-GROW-05-07 | 분석은 6각형 점수 산출 직후(매월 1일) 자동 생성한다 |
| BL-GROW-05-08 | 수동 재분석은 월 1회로 제한한다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 6각형 점수 미산출 | "성장 분석 데이터가 아직 준비되지 않았습니다. 기록을 더 쌓아주세요" |
| 모든 영역 60 이상 | "균형 잡힌 성장을 보이고 있어요! 👏" + 가장 높은 영역 칭찬 |
| AI 분석 생성 실패 | 점수 기반 규칙 분석(부족 영역 표시)만 하고, 상세 제안은 숨김 |
| 이전 월 데이터 없음 | 비교/개선 영역 섹션 숨김 |

### 관련 테이블

```sql
-- ai_growth_analysis (부족 영역 분석 결과)
CREATE TABLE ai_growth_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  weak_areas JSONB NOT NULL,        -- [{area, score, reason}]
  suggestions JSONB NOT NULL,       -- [{area, title, description, difficulty, estimated_time}]
  improvements JSONB,               -- [{area, change}]
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, year_month)
);

CREATE INDEX idx_ai_growth_child_month ON ai_growth_analysis(child_id, year_month DESC);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/growth-analysis?month={YYYY-MM}` | 부족 영역 분석 결과 조회 |
| POST | `/api/v1/children/{child_id}/growth-analysis/refresh` | 수동 재분석 요청 (월 1회) |

---

## Growth 화면 통합 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/growth/overview` | Growth 화면 전체 요약 조회 |

통합 API 응답 구조:

```json
{
  "physical": {
    "latest": { "height": 128.5, "weight": 27, "bmi": 16.3 },
    "percentile": { "height": 65, "weight": 55 },
    "chart_data": [ ... ]
  },
  "sr_scores": {
    "latest_score": 3.5,
    "grade_level": "초등 3학년 수준",
    "chart_data": [ ... ]
  },
  "hexagon": {
    "scores": { "learning": 75, "physical": 70, "social": 45, ... },
    "analysis_text": "..."
  },
  "reading": {
    "current_month": { "count": 8, "goal": 10 },
    "distribution": [ ... ]
  },
  "growth_analysis": {
    "weak_areas": [ ... ],
    "suggestions": [ ... ]
  }
}
```
