# 기능 정의서: Insight (AI 리포트)

> 대상 사용자: 부모 (Primary) | 관련 탭: Insight | 테마 컬러: Indigo `#6366F1`

---

## 개요

Insight 탭은 축적된 데이터를 AI(OpenAI)로 분석하여 부모에게 아이의 성장 인사이트와 맞춤형 육아 코칭을 제공하는 핵심 차별화 기능이다. 하루/주간/월간 리포트, 실시간 코칭, 기질 분석의 5가지 기능으로 구성된다.

---

## AI-01: 하루 요약

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AI-01 |
| 기능명 | 하루 요약 |
| 목적 | 하루 동안의 아이 활동을 AI가 자연스러운 문장으로 요약하고 감정 상태를 추정 |
| 우선순위 | P1 (Sprint 4) |

### 사용자 스토리

- 부모로서, 나는 아이의 하루를 한눈에 요약된 형태로 읽고 싶다
- 부모로서, 나는 바쁜 날에도 아이의 감정 상태를 파악하고 싶다
- 부모로서, 나는 매일 밤 자동으로 요약이 생성되면 좋겠다

### 입력 데이터 소스

| 테이블 | 조회 조건 | 수집 데이터 |
|--------|-----------|-------------|
| `records` | child_id, created_at = 오늘 | 일상 기록 텍스트, 카테고리, 감정 태그 |
| `reading_logs` | child_id, read_date = 오늘 | 읽은 책 제목, 시간 |
| `play_logs` | child_id, played_at = 오늘 | 게임 유형, 점수, 레벨 변동 |
| `schedules` | child_id, date = 오늘 | 일정 목록 |
| `growth_metrics` | child_id, recorded_at = 오늘 (있을 경우) | 신체 측정 데이터 |

### OpenAI 프롬프트 전략

```
시스템 프롬프트:
"당신은 아이의 하루를 따뜻하게 요약해주는 AI 육아 도우미입니다.
부모가 읽기 편하도록 2~4문장으로 요약하고, 아이의 감정 상태를 추정해주세요.
존댓말을 사용하고, 긍정적이면서도 정직한 톤을 유지하세요."

사용자 프롬프트:
"다음은 {child_name}({age}세)의 오늘 하루 데이터입니다.

[일상 기록]
{records_data}

[독서]
{reading_data}

[놀이]
{play_data}

[일정]
{schedule_data}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "하루 요약 텍스트 (2~4문장)",
  "emotion": "happy" | "normal" | "sad" | "tired" | "sick",
  "emotion_reason": "감정 추정 근거 (1문장)",
  "highlights": ["하이라이트 1", "하이라이트 2"],
  "concern": "걱정되는 점 (없으면 null)"
}"
```

### 출력 구조

```json
{
  "id": "uuid",
  "child_id": "uuid",
  "type": "daily",
  "date": "2026-03-18",
  "content": {
    "summary": "오늘 윤호는 학교에서 수학 시험을 잘 봤고, 태권도에서 품새를 연습했어요. 저녁에는 어린왕자를 읽었습니다.",
    "emotion": "happy",
    "emotion_reason": "수학 시험에서 좋은 성적을 거두고, 활동적인 하루를 보냈어요.",
    "highlights": ["수학 시험 100점", "어린왕자 3장 읽음"],
    "concern": null
  },
  "created_at": "2026-03-18T22:00:00Z"
}
```

### 생성 트리거

| 트리거 | 조건 | 설명 |
|--------|------|------|
| 자동 생성 | 매일 22:00 | 하루 기록이 1개 이상 있을 때, FastAPI 스케줄러(cron)로 실행 |
| 수동 요청 | 사용자 버튼 클릭 | Insight 탭에서 "오늘 요약 생성" 버튼, 하루 1회 제한 (자동 생성 이전에만) |

### 캐싱 전략

```
1. 생성된 리포트는 ai_reports 테이블에 저장
2. 같은 날짜의 daily 리포트가 이미 존재하면 DB에서 조회 (재생성 안함)
3. 수동 "새로고침" 버튼으로 강제 재생성 가능 (하루 최대 2회)
4. 프론트엔드에서 SWR/React Query로 캐싱 (staleTime: 5분)
```

### 에러 처리 — 데이터 부족 시

| 상황 | 처리 |
|------|------|
| 기록 0개 (데이터 없음) | 리포트 생성 스킵, "오늘 기록이 없어요. 기록을 남겨보세요!" 안내 |
| 기록 1개만 있음 | 간단한 요약 생성 (1~2문장), 감정 추정은 "normal"로 기본값 |
| OpenAI API 타임아웃 | 30초 타임아웃, 1회 리트라이, 실패 시 "잠시 후 다시 시도해주세요" |
| OpenAI 응답 형식 오류 | JSON 파싱 실패 시 1회 재요청, 실패 시 raw text를 summary로 저장 |
| API 비용 제한 초과 | 사용자에게 "오늘 리포트 생성 횟수를 초과했습니다" 안내 |

### 관련 테이블 / API

| 테이블 | 용도 |
|--------|------|
| `records` | 일상 기록 조회 |
| `reading_logs` | 독서 기록 조회 |
| `play_logs` | 게임 기록 조회 |
| `schedules` | 일정 조회 |
| `ai_reports` | 생성된 리포트 저장 (type='daily') |

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/daily-summary` | 하루 요약 생성 요청 |
| GET | Supabase Client → `ai_reports` | 저장된 리포트 조회 |

---

## AI-02: 주간 리포트

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AI-02 |
| 기능명 | 주간 리포트 |
| 목적 | 1주일간의 행동 패턴을 분석하고 변화 포인트를 부모에게 제공 |
| 우선순위 | P1 (Sprint 4) |

### 사용자 스토리

- 부모로서, 나는 이번 주 아이의 전반적인 패턴을 파악하고 싶다
- 부모로서, 나는 지난 주 대비 어떤 변화가 있었는지 알고 싶다

### 입력 데이터 소스

| 테이블 | 조회 조건 | 수집 데이터 |
|--------|-----------|-------------|
| `records` | child_id, 최근 7일 | 카테고리별 기록 수, 감정 태그 분포 |
| `reading_logs` | child_id, 최근 7일 | 총 독서 시간, 읽은 권수, 분야 분포 |
| `play_logs` | child_id, 최근 7일 | 게임별 플레이 횟수, 평균 점수, 레벨 변동 |
| `schedules` | child_id, 최근 7일 | 일정 이행률 |
| `ai_reports` (daily) | child_id, 최근 7일 | 일별 감정 추이 |
| `growth_metrics` | child_id, 최근 7일 | 신체 변화 (있을 경우) |

### OpenAI 프롬프트 전략

```
시스템 프롬프트:
"당신은 아이의 주간 성장을 분석하는 AI 육아 분석가입니다.
데이터를 기반으로 패턴을 발견하고, 지난 주와의 변화를 짚어주세요.
부모가 행동으로 옮길 수 있는 구체적인 인사이트를 제공하세요."

사용자 프롬프트:
"{child_name}({age}세)의 이번 주({start_date} ~ {end_date}) 데이터입니다.

[이번 주 통계]
- 기록 수: {record_count}건
- 독서: {reading_count}권, {reading_minutes}분
- 놀이: 계산게임 {math_plays}회 (평균 {math_avg}점), 기억력 {memory_plays}회
- 감정 분포: 좋음 {happy}일, 보통 {normal}일, 안좋음 {sad}일
- 일정 이행률: {schedule_completion}%

[지난 주 통계]
{prev_week_stats}

다음 JSON 형식으로 응답:
{
  "period": "2026-03-11 ~ 2026-03-17",
  "summary": "주간 종합 요약 (3~5문장)",
  "patterns": [
    {"area": "영역명", "observation": "관찰 내용", "trend": "up" | "stable" | "down"}
  ],
  "change_points": ["지난 주 대비 주요 변화"],
  "weekly_stats": {
    "record_count": 15,
    "reading_books": 3,
    "reading_minutes": 210,
    "play_count": 8,
    "emotion_distribution": {"happy": 4, "normal": 2, "sad": 1}
  },
  "recommendation": "다음 주를 위한 제안 (1~2문장)"
}"
```

### 출력 구조

```json
{
  "id": "uuid",
  "child_id": "uuid",
  "type": "weekly",
  "date": "2026-03-17",
  "content": {
    "period": "2026-03-11 ~ 2026-03-17",
    "summary": "이번 주 윤호는 독서량이 크게 늘었고...",
    "patterns": [
      {"area": "독서", "observation": "하루 평균 30분에서 40분으로 증가", "trend": "up"},
      {"area": "감정", "observation": "주중 후반으로 갈수록 피곤한 기색", "trend": "down"}
    ],
    "change_points": ["독서 시간 33% 증가", "계산 게임 레벨 2단계 상승"],
    "weekly_stats": { ... },
    "recommendation": "주중 후반에 활동량을 줄이고 충분한 수면을 확보해보세요."
  },
  "created_at": "2026-03-17T22:30:00Z"
}
```

### 생성 트리거

| 트리거 | 조건 | 설명 |
|--------|------|------|
| 자동 생성 | 매주 일요일 22:30 | 해당 주 기록이 3개 이상 있을 때 |
| 수동 요청 | 사용자 "주간 리포트 생성" 클릭 | 주 1회 제한 |

### 캐싱 전략

```
1. ai_reports 테이블에 type='weekly', date=해당 주 일요일 날짜로 저장
2. 같은 주의 weekly 리포트가 이미 존재하면 DB 조회
3. 강제 재생성: 주당 최대 1회
4. 프론트엔드 캐싱: staleTime 30분
```

### 에러 처리 — 데이터 부족 시

| 상황 | 처리 |
|------|------|
| 기록 3개 미만 | "이번 주는 기록이 부족해서 리포트를 생성할 수 없어요. 더 많이 기록해보세요!" |
| 지난 주 데이터 없음 (첫 주) | 변화 포인트 없이 이번 주 분석만 제공 |
| OpenAI 실패 | 리트라이 1회, 실패 시 안내 메시지 |

### 관련 테이블 / API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/weekly-report` | 주간 리포트 생성 |
| GET | Supabase Client → `ai_reports` | 저장된 주간 리포트 조회 |

---

## AI-03: 월간 리포트

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AI-03 |
| 기능명 | 월간 리포트 |
| 목적 | 1개월간의 종합 성장 분석, 독서 성향 분석, 장기 트렌드 제공 |
| 우선순위 | P1 (Sprint 4) |

### 사용자 스토리

- 부모로서, 나는 한 달 동안 아이가 어떤 영역에서 성장했는지 종합적으로 알고 싶다
- 부모로서, 나는 아이의 독서 성향(선호 장르, 독서량 변화)을 파악하고 싶다

### 입력 데이터 소스

| 테이블 | 조회 조건 | 수집 데이터 |
|--------|-----------|-------------|
| `records` | child_id, 해당 월 | 총 기록 수, 카테고리 분포, 마일스톤 |
| `reading_logs` | child_id, 해당 월 | 총 독서량, 분야별 분포, 독서 시간 추이 |
| `play_logs` | child_id, 해당 월 | 게임별 성장 추이, 레벨 변동 |
| `growth_metrics` | child_id, 해당 월 | 신체 성장 변화 |
| `hexagon_scores` | child_id, 해당 월 | 6각형 점수 변화 |
| `ai_reports` (weekly) | child_id, 해당 월 | 주간 리포트 요약 취합 |

### OpenAI 프롬프트 전략

```
시스템 프롬프트:
"당신은 아이의 월간 성장을 종합 분석하는 AI 육아 컨설턴트입니다.
한 달간의 데이터를 기반으로 성장 평가와 독서 성향 분석을 제공합니다.
격려하면서도 개선점을 구체적으로 제시해주세요."

사용자 프롬프트:
"{child_name}({age}세)의 {year}년 {month}월 월간 데이터입니다.

[월간 통계]
{monthly_stats}

[주간 리포트 요약]
{weekly_summaries}

[6각형 인재 분석 변화]
{hexagon_changes}

[독서 데이터]
{reading_details}

다음 JSON 형식으로:
{
  "period": "2026년 3월",
  "overall_summary": "월간 종합 요약 (5~8문장)",
  "growth_analysis": {
    "strongest_area": "가장 성장한 영역",
    "weakest_area": "보완이 필요한 영역",
    "hexagon_change": {"학습": +5, "신체": -2, ...}
  },
  "reading_analysis": {
    "total_books": 8,
    "total_minutes": 840,
    "favorite_genre": "과학",
    "genre_distribution": {"과학": 3, "동화": 2, "역사": 2, "기타": 1},
    "reading_trend": "증가" | "유지" | "감소",
    "recommendation": "독서 관련 제안"
  },
  "monthly_highlights": ["주요 성취/이벤트 목록"],
  "next_month_goals": ["다음 달 제안 목표"]
}"
```

### 출력 구조

```json
{
  "id": "uuid",
  "child_id": "uuid",
  "type": "monthly",
  "date": "2026-03-31",
  "content": {
    "period": "2026년 3월",
    "overall_summary": "3월 한 달간 윤호는 특히 학습 영역에서 큰 성장을 보였습니다...",
    "growth_analysis": {
      "strongest_area": "학습",
      "weakest_area": "신체",
      "hexagon_change": {"학습": 8, "신체": -2, "사회성": 3, "감정": 5, "창의성": 4, "습관": 6}
    },
    "reading_analysis": {
      "total_books": 8,
      "total_minutes": 840,
      "favorite_genre": "과학",
      "genre_distribution": {"과학": 3, "동화": 2, "역사": 2, "기타": 1},
      "reading_trend": "증가",
      "recommendation": "과학 외에 다양한 장르도 접해보면 좋겠어요."
    },
    "monthly_highlights": ["수학 게임 레벨 15 달성", "독서 목표 달성"],
    "next_month_goals": ["신체 활동 시간 늘리기", "창의성 활동 도전"]
  },
  "created_at": "2026-03-31T23:00:00Z"
}
```

### 생성 트리거

| 트리거 | 조건 | 설명 |
|--------|------|------|
| 자동 생성 | 매월 마지막 날 23:00 | 해당 월 기록이 10개 이상 있을 때 |
| 수동 요청 | 사용자 "월간 리포트 생성" 클릭 | 월 1회 제한 |

### 캐싱 전략

```
1. ai_reports 테이블에 type='monthly', date=해당 월 마지막 날로 저장
2. 같은 월의 monthly 리포트가 이미 존재하면 DB 조회
3. 강제 재생성: 월당 최대 1회
4. 프론트엔드 캐싱: staleTime 1시간
```

### 에러 처리 — 데이터 부족 시

| 상황 | 처리 |
|------|------|
| 기록 10개 미만 | "이번 달은 데이터가 부족해요. 리포트 생성에는 최소 10개의 기록이 필요합니다." |
| 독서 기록 없음 | reading_analysis 부분을 "독서 기록이 없습니다"로 대체 |
| 이전 월 데이터 없음 (첫 월) | 비교 분석 없이 현재 월 분석만 제공 |

### 관련 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/monthly-report` | 월간 리포트 생성 |
| GET | Supabase Client → `ai_reports` | 저장된 월간 리포트 조회 |

---

## AI-04: AI 육아 코칭

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AI-04 |
| 기능명 | AI 육아 코칭 |
| 목적 | 부모에게 아이와의 상호작용 가이드, 대화 추천, 맞춤 조언 제공 |
| 우선순위 | P1 (Sprint 4) |

### 사용자 스토리

- 부모로서, 나는 오늘 아이에게 어떤 말을 건네면 좋을지 구체적인 안내를 받고 싶다
- 부모로서, 나는 아이의 현재 상태에 맞는 양육 팁을 얻고 싶다

### 입력 데이터 소스

| 테이블 | 조회 조건 | 수집 데이터 |
|--------|-----------|-------------|
| `ai_reports` (daily) | child_id, 오늘 | 하루 요약, 감정 상태 |
| `records` | child_id, 최근 3일 | 최근 기록 내용, 감정 태그 |
| `reading_logs` | child_id, 최근 7일 | 독서 현황 |
| `play_logs` | child_id, 최근 7일 | 게임 성과 |
| `hexagon_scores` | child_id, 최신 | 현재 6각형 점수 |

### OpenAI 프롬프트 전략

```
시스템 프롬프트:
"당신은 아동 발달 전문가이자 부모 코칭 AI입니다.
부모가 오늘 실천할 수 있는 구체적인 행동 가이드와 대화 추천을 제공합니다.
지시적이지 않고, 부모의 자율성을 존중하는 따뜻한 톤을 사용하세요.
한국 문화와 교육 맥락을 반영해주세요."

사용자 프롬프트:
"{child_name}({age}세)의 현재 상태입니다.

[오늘 요약]
{daily_summary}

[감정 상태]
{emotion} - {emotion_reason}

[최근 성과]
{recent_achievements}

[보완 영역]
{weak_areas}

다음 JSON 형식으로:
{
  "coaching_items": [
    {
      "type": "action" | "conversation" | "activity",
      "title": "코칭 제목",
      "detail": "구체적인 가이드 (2~3문장)",
      "example": "예시 대화/행동"
    }
  ],
  "conversation_starters": [
    "오늘 아이에게 건넬 수 있는 말 (3개)"
  ],
  "today_tip": "오늘의 육아 팁 (1문장)"
}"
```

### 출력 구조

```json
{
  "coaching_items": [
    {
      "type": "conversation",
      "title": "수학 성취 칭찬하기",
      "detail": "오늘 수학 시험을 잘 봤다고 기록되어 있어요. 결과보다 노력을 칭찬해주세요.",
      "example": "\"윤호야, 수학 시험 준비하느라 열심히 했구나! 노력한 게 결과로 보이네.\""
    },
    {
      "type": "activity",
      "title": "독서 후 대화 나누기",
      "detail": "어린왕자를 읽고 있으니, 내용에 대해 자연스럽게 대화를 나눠보세요.",
      "example": "\"오늘 어린왕자에서 어떤 장면이 제일 기억에 남아?\""
    }
  ],
  "conversation_starters": [
    "오늘 학교에서 가장 재미있었던 건 뭐야?",
    "태권도 품새 연습 어땠어?",
    "어린왕자 다음 장은 뭐가 나올 것 같아?"
  ],
  "today_tip": "아이가 성취를 경험한 날에는 구체적으로 칭찬하면 자신감이 쌓여요."
}
```

### 생성 트리거

| 트리거 | 조건 | 설명 |
|--------|------|------|
| 자동 생성 | 하루 요약(AI-01) 생성 직후 | 하루 요약 데이터를 기반으로 연쇄 생성 |
| 수동 요청 | Home 탭 "AI 코칭" 카드 또는 Insight 탭 | 하루 2회 제한 |

### 캐싱 전략

```
1. ai_reports 테이블에 type='coaching', date=오늘로 저장
2. 같은 날 coaching이 존재하면 DB 조회
3. 자동 생성분은 1회, 수동 요청은 추가 1회 허용 (하루 최대 2회)
4. Home 탭의 AI 코칭 카드는 가장 최신 coaching 데이터 표시
```

### 에러 처리 — 데이터 부족 시

| 상황 | 처리 |
|------|------|
| 하루 요약 없음 | 일반적인 연령대 기반 코칭 제공 (개인화 없음) |
| 기록 데이터 전무 | "아이의 하루를 기록하면 맞춤형 코칭을 받을 수 있어요!" 안내 |
| OpenAI 실패 | 사전 준비된 일반 코칭 팁 표시 (연령대별 5~10개 준비) |

### 관련 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/coaching` | 육아 코칭 생성 |
| GET | Supabase Client → `ai_reports` | 저장된 코칭 조회 (type='coaching') |

---

## AI-05: 기질/사주 리포트

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | AI-05 |
| 기능명 | 기질/사주 리포트 |
| 목적 | 생년월일+출생시간 기반 성향 분석 및 양육 가이드 제공 (엔터테인먼트+참고용) |
| 우선순위 | P2 (Sprint 5) |

### 사용자 스토리

- 부모로서, 나는 아이의 타고난 기질/성향을 재미있게 알아보고 싶다
- 부모로서, 나는 기질 분석을 바탕으로 양육 방향에 대한 참고 정보를 얻고 싶다

### 입력 데이터 소스

| 데이터 | 소스 | 필수 여부 |
|--------|------|-----------|
| 이름 | `children.name` | 필수 |
| 생년월일 | `children.birth_date` | 필수 |
| 성별 | `children.gender` | 필수 |
| 출생 시간 | `children.birth_time` | 선택 (미입력 시 시간 제외 분석) |

### OpenAI 프롬프트 전략

```
시스템 프롬프트:
"당신은 동양 역학(사주/기질) 기반의 아이 성향 분석 전문가입니다.
과학적 근거보다는 전통 역학 관점에서 재미있고 따뜻하게 분석해주세요.
부정적인 표현은 피하고, 모든 기질을 긍정적 관점에서 해석하세요.
분석 결과를 양육에 실질적으로 활용할 수 있는 가이드를 포함하세요.
반드시 '참고용이며 과학적 근거와는 다를 수 있습니다'라는 안내를 포함하세요."

사용자 프롬프트:
"다음 아이의 기질/사주 분석을 해주세요.

이름: {name}
생년월일: {birth_date} (양력)
성별: {gender}
출생시간: {birth_time | '미입력'}

다음 JSON 형식으로:
{
  "basic_info": {
    "zodiac_animal": "띠",
    "element": "오행 (목/화/토/금/수)",
    "yin_yang": "음/양"
  },
  "personality_traits": [
    {"trait": "성향명", "description": "설명", "strength": "강점", "caution": "유의점"}
  ],
  "temperament_type": {
    "type_name": "기질 유형명 (예: 탐험가형)",
    "description": "기질 유형 설명 (3~5문장)",
    "compatible_activities": ["잘 맞는 활동들"]
  },
  "parenting_guide": {
    "communication_style": "소통 방식 가이드",
    "motivation_method": "동기부여 방법",
    "caution_points": ["양육 시 유의사항"],
    "recommended_activities": ["추천 활동"]
  },
  "disclaimer": "본 분석은 전통 역학 관점의 참고 자료이며, 과학적 근거와는 다를 수 있습니다."
}"
```

### 출력 구조

```json
{
  "id": "uuid",
  "child_id": "uuid",
  "type": "personality",
  "date": "2026-03-18",
  "content": {
    "basic_info": {
      "zodiac_animal": "개띠",
      "element": "토",
      "yin_yang": "양"
    },
    "personality_traits": [
      {
        "trait": "성실함",
        "description": "맡은 일을 끝까지 해내려는 성향이 강합니다.",
        "strength": "꾸준함과 책임감",
        "caution": "완벽주의로 인한 스트레스에 유의"
      }
    ],
    "temperament_type": {
      "type_name": "탐험가형",
      "description": "새로운 것에 대한 호기심이 강하고...",
      "compatible_activities": ["과학 실험", "자연 탐험", "독서"]
    },
    "parenting_guide": {
      "communication_style": "선택지를 주고 스스로 결정하게 해주세요.",
      "motivation_method": "구체적인 과정 칭찬이 효과적입니다.",
      "caution_points": ["과도한 통제 지양", "실패를 허용하는 분위기"],
      "recommended_activities": ["야외 탐험", "만들기 활동", "과학 관련 독서"]
    },
    "disclaimer": "본 분석은 전통 역학 관점의 참고 자료이며, 과학적 근거와는 다를 수 있습니다."
  },
  "created_at": "2026-03-18T14:00:00Z"
}
```

### 생성 트리거

| 트리거 | 조건 | 설명 |
|--------|------|------|
| 수동 요청 | Insight 탭 "기질 리포트" 카드 클릭 | 1회 생성 후 영구 캐싱 |
| 출생시간 추가 | children 테이블에 birth_time 업데이트 시 | 재생성 가능 (시간 반영) |

### 캐싱 전략

```
1. ai_reports 테이블에 type='personality'로 저장
2. 1회 생성 후 영구 캐싱 — 같은 child_id의 personality 리포트가 있으면 항상 DB 조회
3. 재생성 조건: 출생시간이 새로 입력/변경된 경우에만
4. 프론트엔드에서 Infinity staleTime으로 캐싱
5. AI API 비용 절감: 가장 비용 효율적인 리포트 (1회만 생성)
```

### 에러 처리 — 데이터 부족 시

| 상황 | 처리 |
|------|------|
| 생년월일 미입력 | "아이 프로필에서 생년월일을 먼저 입력해주세요" 안내, 프로필 편집 이동 |
| 출생시간 미입력 | 시간 제외 분석 진행, "출생시간을 추가하면 더 정확한 분석이 가능합니다" 안내 |
| OpenAI 실패 | 리트라이 2회, 실패 시 "분석을 준비 중입니다. 잠시 후 다시 시도해주세요" |

### 관련 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/ai/personality` | 기질/사주 리포트 생성 |
| GET | Supabase Client → `ai_reports` | 저장된 리포트 조회 (type='personality') |
| GET | Supabase Client → `children` | 생년월일, 출생시간 조회 |

---

## 공통 사항

### OpenAI API 설정

| 항목 | 값 |
|------|-----|
| 모델 | gpt-4o (기본), gpt-4o-mini (퀴즈/간단 요약) |
| Temperature | 0.7 (리포트), 0.5 (코칭), 0.8 (기질 분석) |
| Max Tokens | 1000 (하루 요약), 2000 (주간/월간), 2500 (기질) |
| Timeout | 30초 |
| 리트라이 | 최대 2회 (exponential backoff) |

### 비용 관리 전략

| 전략 | 설명 |
|------|------|
| 캐싱 우선 | DB에 저장된 리포트가 있으면 API 호출 안 함 |
| 생성 횟수 제한 | 일일: 하루 요약 2회, 코칭 2회 / 주간: 1회 / 월간: 1회 |
| 모델 선택 | 간단한 요약은 gpt-4o-mini 사용 |
| 기질 리포트 | 1회 생성 후 영구 캐싱 |

### ai_reports 테이블 활용

| type | 생성 주기 | 캐싱 기간 |
|------|-----------|-----------|
| daily | 매일 | 영구 (이력 보존) |
| weekly | 매주 | 영구 |
| monthly | 매월 | 영구 |
| coaching | 매일 | 영구 |
| personality | 1회 | 영구 (출생시간 변경 시 재생성) |

---

## 전체 우선순위 정리

| 기능 ID | 기능명 | 우선순위 | Sprint | 의존성 |
|---------|--------|----------|--------|--------|
| AI-01 | 하루 요약 | P1 | Sprint 4 | records, reading_logs, play_logs, OpenAI |
| AI-02 | 주간 리포트 | P1 | Sprint 4 | AI-01 (daily 데이터 참조) |
| AI-03 | 월간 리포트 | P1 | Sprint 4 | AI-02 (weekly 데이터 참조) |
| AI-04 | AI 육아 코칭 | P1 | Sprint 4 | AI-01 (하루 요약 기반) |
| AI-05 | 기질/사주 리포트 | P2 | Sprint 5 | children 테이블 (생년월일) |
