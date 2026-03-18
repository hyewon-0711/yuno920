# 기능 정의서: Record (기록)

> Yuno920 — AI 기반 아이 성장·육아 통합 플랫폼
> 문서 버전: v1.0 | 작성일: 2026-03-18

---

## 개요

Record 탭은 아이의 일상을 텍스트, 사진, 감정과 함께 기록하고, 타임라인/캘린더 형태로 열람하며, 독서 기록과 마일스톤을 체계적으로 관리하는 화면이다. 축적된 기록은 AI 인사이트와 6각형 인재 분석의 핵심 데이터 소스가 된다.

**탭 테마 컬러:** Blue `#3B82F6`

---

## REC-01: 일상 기록 작성

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | REC-01 |
| 기능명 | 일상 기록 작성 |
| 목적 | 아이의 하루를 텍스트, 사진, 감정, 카테고리와 함께 빠르게 기록하며, AI가 자동 태깅하여 기록의 부담을 줄인다 |
| 우선순위 | **P0** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-REC-01-01 | As a 부모, I want to 아이의 오늘 있었던 일을 텍스트로 간편하게 기록하고 싶다, so that 일상을 빠짐없이 남길 수 있다 |
| US-REC-01-02 | As a 부모, I want to 기록에 사진을 첨부하고 싶다, so that 시각적인 추억을 함께 남길 수 있다 |
| US-REC-01-03 | As a 부모, I want to 아이의 오늘 기분/감정을 선택하고 싶다, so that 감정 변화를 추적할 수 있다 |
| US-REC-01-04 | As a 부모, I want to 기록을 카테고리별로 분류하고 싶다, so that 나중에 원하는 기록을 쉽게 찾을 수 있다 |
| US-REC-01-05 | As a 부모, I want to AI가 기록 내용을 분석해 태그를 자동으로 달아주길 원한다, so that 분류 작업에 시간을 들이지 않아도 된다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| content | text | Y | 기록 본문 | 1~2000자 |
| record_date | date | Y | 기록 날짜 | 기본값: 오늘, 과거 날짜 가능 |
| emotion | enum | N | 감정 상태 | happy(😊), neutral(😐), sad(😢), sick(🤒), tired(😴) |
| categories | enum[] | N | 카테고리 (복수 선택) | health, meal, learning, play, emotion, reading, milestone |
| images | file[] | N | 사진 파일 | 최대 5장, JPEG/PNG, 장당 10MB 이하 |
| tags | string[] | N | 수동 태그 | 최대 10개, 태그당 20자 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| record_id | UUID | 생성된 기록 ID |
| auto_tags | string[] | AI 자동 생성 태그 |
| auto_categories | enum[] | AI 추천 카테고리 |
| created_at | datetime | 생성 시간 |

### UI 요소

와이어프레임 참조: "Record — 새 기록 작성" 화면

```
┌─────────────────────────────┐
│  ←    기록 작성      [저장]  │   ← 헤더: 뒤로 + 제목 + 저장 버튼
├─────────────────────────────┤
│                             │
│  날짜: 2026.03.18 (화) ▼    │   ← 날짜 선택 (DatePicker)
│                             │
│  ── 오늘의 기분 ───────────  │
│  😊  😐  😢  🤒  😴         │   ← 감정 선택 (단일)
│                             │
│  ── 카테고리 ──────────────  │
│  [건강] [식사] [학습] [놀이]  │   ← 카테고리 칩 (복수 선택)
│  [감정] [독서] [마일스톤]     │
│                             │
│  ┌───────────────────────┐  │
│  │                        │  │   ← 텍스트 입력 영역
│  │  오늘 있었던 일을        │  │
│  │  자유롭게 적어주세요      │  │   ← 플레이스홀더
│  │                        │  │
│  │                        │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  📷 사진 추가 (최대 5장) │  │   ← 이미지 업로드 영역
│  │  [+] [img] [img]        │  │
│  └───────────────────────┘  │
│                             │
│  ── AI 추천 태그 ──────────  │
│  [#학교] [#칭찬] [#수학]     │   ← 자동 태깅 (저장 후 표시)
│                             │
└─────────────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 헤더 | 좌: ← 뒤로, 중: "기록 작성", 우: "저장" Primary 텍스트 버튼 |
| 날짜 선택 | Body L, 탭 시 DatePicker 바텀시트 |
| 감정 선택 | 40px 원형 버튼 5개, 선택 시 테두리 Primary + 확대(1.2x) + 감정 컬러 배경 |
| 카테고리 칩 | 28px 높이, rounded-full, 미선택: Gray-100 배경 + Gray-700, 선택: Record 테마(#3B82F6) 배경 + White |
| 텍스트 입력 | 최소 높이 200px, auto-expand, Gray-300 테두리, 포커스 시 Primary 테두리 |
| 글자수 카운터 | 우하단, Caption (12px), "{current}/2000" |
| 사진 영역 | 가로 스크롤, 80×80px 썸네일 + [+] 추가 버튼 |
| 사진 추가 버튼 | 80×80 점선 테두리, 📷 아이콘, 탭 시 카메라/갤러리 선택 액션시트 |
| 사진 삭제 | 썸네일 우상단 × 버튼 |
| AI 태그 | 저장 후 자동 생성, Secondary 배경 칩, 탭으로 제거 가능 |
| 저장 버튼 상태 | content가 비어있으면 비활성(Gray-300), 입력 시 활성(Primary) |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-REC-01-01 | 기록 본문(content)은 최소 1자 이상 입력해야 저장 가능하다 |
| BL-REC-01-02 | 사진은 최대 5장까지 업로드 가능하며, 업로드 전 클라이언트에서 1200px 리사이즈한다 |
| BL-REC-01-03 | 사진은 Supabase Storage에 저장하고, 경로를 record_images 테이블에 기록한다 |
| BL-REC-01-04 | 감정 선택은 선택사항이며, 단일 선택만 가능하다 |
| BL-REC-01-05 | 카테고리는 복수 선택 가능하며, 최소 0개~최대 3개까지 선택 가능하다 |
| BL-REC-01-06 | AI 자동 태깅: 기록 저장 직후 비동기로 content를 분석하여 최대 5개 태그를 생성한다 |
| BL-REC-01-07 | AI 자동 카테고리 추천: content 분석 후 관련 카테고리를 추천한다. 사용자가 이미 선택한 카테고리와 병합한다 |
| BL-REC-01-08 | 저장 시 임시저장(draft) 기능: 앱을 벗어나도 작성 중 내용이 보존된다 (로컬 스토리지) |
| BL-REC-01-09 | 기록 날짜는 과거 날짜 선택 가능하되, 미래 날짜는 불가하다 |
| BL-REC-01-10 | 저장 성공 시 토스트: "기록이 저장되었습니다" + 기록 목록으로 자동 이동 |
| BL-REC-01-11 | 사진 업로드 중 프로그레스 표시, 업로드 완료 후 텍스트 저장 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 본문 미입력 저장 시도 | 저장 버튼 비활성 + 포커스 이동 시 "내용을 입력해주세요" 토스트 |
| 사진 5장 초과 | 추가 버튼 비활성 + "최대 5장까지 추가할 수 있어요" 토스트 |
| 사진 용량 초과 (>10MB) | "사진 크기가 너무 큽니다. 10MB 이하 사진을 선택해주세요" |
| 사진 업로드 실패 | 해당 사진에 경고 표시 + "재업로드" 버튼 |
| 네트워크 끊김 | 임시저장 후 "네트워크 연결을 확인해주세요. 임시저장되었습니다" |
| AI 태깅 실패 | 태그 없이 기록 저장 완료 (태그는 부가 기능) |
| 뒤로가기 (작성 중) | "작성 중인 내용이 있습니다. 나가시겠습니까?" 확인 다이얼로그 |
| 이미지 형식 미지원 | "JPEG 또는 PNG 파일만 업로드 가능합니다" |

### 관련 테이블

```sql
-- records (확장)
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  emotion VARCHAR(10),               -- happy, neutral, sad, sick, tired
  categories TEXT[] DEFAULT '{}',     -- {health, meal, learning, play, emotion, reading, milestone}
  tags TEXT[] DEFAULT '{}',           -- 수동 + AI 자동 태그 통합
  auto_tags TEXT[] DEFAULT '{}',      -- AI 자동 생성 태그 (별도 보관)
  is_draft BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_records_child_date ON records(child_id, record_date DESC);
CREATE INDEX idx_records_categories ON records USING GIN(categories);
CREATE INDEX idx_records_tags ON records USING GIN(tags);
CREATE INDEX idx_records_emotion ON records(child_id, emotion);

-- record_images
CREATE TABLE record_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,         -- Supabase Storage 경로
  sort_order INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,                  -- bytes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_record_images_record ON record_images(record_id, sort_order);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/v1/children/{child_id}/records` | 기록 생성 (multipart/form-data) |
| PUT | `/api/v1/children/{child_id}/records/{id}` | 기록 수정 |
| DELETE | `/api/v1/children/{child_id}/records/{id}` | 기록 삭제 (소프트 삭제) |
| POST | `/api/v1/children/{child_id}/records/{id}/images` | 사진 추가 업로드 |
| DELETE | `/api/v1/children/{child_id}/records/{id}/images/{image_id}` | 사진 삭제 |
| POST | `/api/v1/children/{child_id}/records/{id}/auto-tag` | AI 자동 태깅 요청 |

---

## REC-02: 기록 목록 / 타임라인

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | REC-02 |
| 기능명 | 기록 목록 / 타임라인 |
| 목적 | 작성된 기록을 타임라인(날짜순)과 캘린더 뷰로 열람하고, 카테고리/감정/키워드로 필터링 및 검색한다 |
| 우선순위 | **P0** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-REC-02-01 | As a 부모, I want to 날짜별로 기록을 타임라인 형태로 보고 싶다, so that 아이의 일상 흐름을 시간순으로 파악할 수 있다 |
| US-REC-02-02 | As a 부모, I want to 캘린더에서 기록이 있는 날짜를 확인하고 싶다, so that 특정 날짜의 기록을 빠르게 찾을 수 있다 |
| US-REC-02-03 | As a 부모, I want to 카테고리나 감정으로 기록을 필터링하고 싶다, so that 원하는 종류의 기록만 모아볼 수 있다 |
| US-REC-02-04 | As a 부모, I want to 키워드로 기록을 검색하고 싶다, so that 특정 내용이 담긴 기록을 찾을 수 있다 |

### 입력 데이터 (필터/검색)

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| view_type | enum | N | 뷰 타입 | timeline / calendar, 기본: timeline |
| date_from | date | N | 시작일 | 캘린더 뷰에서 사용 |
| date_to | date | N | 종료일 | |
| categories | enum[] | N | 카테고리 필터 | 복수 선택 |
| emotions | enum[] | N | 감정 필터 | 복수 선택 |
| keyword | string | N | 검색 키워드 | 최소 2자 |
| page | integer | N | 페이지 번호 | 기본 1 |
| limit | integer | N | 페이지 크기 | 기본 20, 최대 50 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| records | array | 기록 목록 |
| records[].id | UUID | 기록 ID |
| records[].content | string | 본문 (목록에서는 100자 미리보기) |
| records[].record_date | date | 기록 날짜 |
| records[].emotion | string | 감정 이모지 |
| records[].categories | string[] | 카테고리 태그 목록 |
| records[].tags | string[] | 태그 목록 |
| records[].image_count | integer | 첨부 사진 수 |
| records[].thumbnail_url | string | 첫 번째 사진 썸네일 URL |
| records[].created_at | datetime | 작성 시간 |
| total_count | integer | 전체 기록 수 |
| has_more | boolean | 추가 페이지 존재 여부 |
| calendar_dots | object | 캘린더 뷰용 날짜별 기록 여부 {date: count} |

### UI 요소

와이어프레임 참조: "Record — 목록" 화면

```
┌─────────────────────────────┐
│        기록           [📅]   │   ← 헤더: 제목 + 캘린더 토글
├─────────────────────────────┤
│                             │
│  [타임라인 뷰] [캘린더 뷰]   │   ← 뷰 전환 탭
│                             │
│  🔍 검색...                  │   ← 검색 바
│  [건강] [식사] [학습] ...    │   ← 카테고리 필터 칩 (가로 스크롤)
│                             │
│  ── 2026년 3월 18일 ────────│   ← 날짜 구분선
│  ┌───────────────────────┐  │
│  │ 😊 오늘 학교에서 칭찬    │  │   ← 기록 카드
│  │ 받았대요! 수학 100점     │  │
│  │ [건강] [학습]    15:30   │  │   ← 카테고리 칩 + 시간
│  │ [📸 사진 1장]            │  │   ← 사진 썸네일
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 📚 "어린왕자" 3장 읽음   │  │   ← 독서 기록 카드
│  │ [독서]          20:00   │  │
│  └───────────────────────┘  │
│                             │
│  ── 2026년 3월 17일 ────────│
│  ┌───────────────────────┐  │
│  │ 🤒 오늘 좀 피곤해보였어요│  │
│  │ [건강] [감정]    21:00   │  │
│  └───────────────────────┘  │
│                             │
│         ┌─────────┐         │
│         │  ＋ 기록  │         │   ← FAB (Floating Action Button)
│         └─────────┘         │
│                             │
├─────────────────────────────┤
│  Home Growth Record Play AI │
└─────────────────────────────┘
```

**캘린더 뷰:**

```
┌─────────────────────────────┐
│     ← 2026년 3월 →          │
│  일  월  화  수  목  금  토   │
│                    1   2    │
│   3   4   5   6   7   8  9 │
│  10  11  12  13  14  15 16  │
│  17● 18● 19  20  21  22 23  │   ← ● = 기록 있는 날 (도트)
│  24  25  26  27  28  29 30  │
│  31                         │
├─────────────────────────────┤
│  3월 18일의 기록 (2건)       │   ← 선택 날짜의 기록 목록
│  ┌───────────────────────┐  │
│  │ 😊 학교에서 칭찬...      │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 📚 어린왕자 3장 읽음...  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 뷰 전환 탭 | 세그먼트 컨트롤: "타임라인" / "캘린더", Record 테마 컬러 |
| 검색 바 | 높이 40px, rounded-lg, Gray-100 배경, 🔍 아이콘 + 플레이스홀더 |
| 필터 칩 | 가로 스크롤, 카테고리별 칩 (선택 시 Record 테마 배경) |
| 날짜 구분선 | Caption (12px, Medium), Gray-500, 좌측 정렬 |
| 기록 카드 | 흰색 배경, rounded-xl, shadow-sm, padding 16px |
| 감정 이모지 | 카드 좌상단, 20px |
| 본문 미리보기 | Body L (16px), 최대 2줄 + ellipsis |
| 카테고리 칩 | 카드 하단 좌측, Caption 크기, 각 카테고리별 light 컬러 |
| 시간 | 카드 하단 우측, Caption, Gray-400 |
| 사진 표시 | 📸 아이콘 + "사진 N장" 텍스트, 또는 미니 썸네일 |
| FAB | 56px 원형, Primary 배경, White 텍스트 "＋ 기록", shadow-md |
| 캘린더 | 월간 캘린더, 기록 있는 날에 Record 테마 컬러 도트 |
| 무한 스크롤 | 타임라인 뷰에서 스크롤 시 자동 로딩 |
| 빈 상태 | "아직 기록이 없어요. 첫 기록을 남겨보세요!" + FAB 강조 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-REC-02-01 | 타임라인 뷰는 최신 날짜순(DESC)으로 정렬하며, 같은 날짜 내에서는 최신 시간순이다 |
| BL-REC-02-02 | 목록에서 본문은 100자까지 미리보기하고, 초과 시 "..." 처리한다 |
| BL-REC-02-03 | 무한 스크롤: 페이지당 20건씩 로드하며, 스크롤 하단 200px 도달 시 다음 페이지 로드한다 |
| BL-REC-02-04 | 캘린더 뷰에서 날짜 선택 시 해당 날짜의 기록만 하단에 표시한다 |
| BL-REC-02-05 | 캘린더 도트: 기록 1~2건이면 도트 1개, 3건 이상이면 도트 2개로 구분한다 |
| BL-REC-02-06 | 카테고리 필터: 복수 선택 시 OR 조건 (하나라도 포함된 기록 표시) |
| BL-REC-02-07 | 검색은 content + tags 필드를 대상으로 한글 형태소 분석 기반 검색한다 |
| BL-REC-02-08 | 검색어 최소 2자 이상부터 검색 실행한다 |
| BL-REC-02-09 | 소프트 삭제된 기록(is_deleted=true)은 목록에 표시하지 않는다 |
| BL-REC-02-10 | 기록 카드 탭 시 상세 보기 화면으로 이동한다 |
| BL-REC-02-11 | 기록 카드 길게 누르기(long press) 시 수정/삭제 컨텍스트 메뉴를 표시한다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 기록 없음 | 빈 상태 일러스트 + "아직 기록이 없어요. 첫 기록을 남겨보세요!" |
| 검색 결과 없음 | "'{keyword}'에 대한 검색 결과가 없습니다" + 필터 초기화 버튼 |
| 필터 결과 없음 | "선택한 조건에 맞는 기록이 없습니다" + 필터 초기화 |
| 이미지 로딩 실패 | 기본 placeholder 이미지 표시 |
| 무한 스크롤 로딩 실패 | "더 불러오지 못했습니다. 탭하여 재시도" |

### 관련 테이블

```sql
-- records, record_images (REC-01에서 정의)
-- 추가 인덱스

CREATE INDEX idx_records_content_search ON records USING GIN(to_tsvector('simple', content));
CREATE INDEX idx_records_child_emotion ON records(child_id, emotion, record_date DESC);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/records` | 기록 목록 조회 (필터/검색/페이지네이션) |
| GET | `/api/v1/children/{child_id}/records/{id}` | 기록 상세 조회 |
| GET | `/api/v1/children/{child_id}/records/calendar?month={YYYY-MM}` | 캘린더용 날짜별 기록 수 |

**목록 조회 쿼리 파라미터:**

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| page | 페이지 번호 | 1 |
| limit | 페이지 크기 | 20 |
| date_from | 시작일 | 2026-03-01 |
| date_to | 종료일 | 2026-03-31 |
| categories | 카테고리 필터 (콤마 구분) | health,learning |
| emotions | 감정 필터 (콤마 구분) | happy,neutral |
| keyword | 검색 키워드 | 학교 칭찬 |
| sort | 정렬 | record_date_desc (기본) |

---

## REC-03: 마일스톤

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | REC-03 |
| 기능명 | 마일스톤 |
| 목적 | 아이의 주요 성장 이벤트(첫 걸음마, 첫 자전거 등)를 특별한 기록으로 등록하고, AI가 기록 데이터에서 마일스톤 후보를 자동 추천한다 |
| 우선순위 | **P2** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-REC-03-01 | As a 부모, I want to 아이의 중요한 순간을 마일스톤으로 기록하고 싶다, so that 특별한 기억을 따로 관리할 수 있다 |
| US-REC-03-02 | As a 부모, I want to AI가 마일스톤 후보를 추천해주길 원한다, so that 중요한 순간을 놓치지 않을 수 있다 |
| US-REC-03-03 | As a 부모, I want to 마일스톤 모음을 모아보고 싶다, so that 아이의 성장 하이라이트를 한눈에 볼 수 있다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| title | string | Y | 마일스톤 제목 | 1~100자 |
| description | text | N | 상세 설명 | 최대 500자 |
| milestone_date | date | Y | 이벤트 날짜 | |
| milestone_type | enum | Y | 유형 | first(처음), achievement(달성), growth(성장), custom(기타) |
| image | file | N | 대표 사진 | 1장, JPEG/PNG, 10MB 이하 |
| linked_record_id | UUID | N | 연결된 기록 ID | 기존 기록에서 마일스톤 전환 시 |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| milestone_id | UUID | 마일스톤 ID |
| ai_suggestions | array | AI 추천 마일스톤 목록 |
| ai_suggestions[].source_record_id | UUID | 근거 기록 ID |
| ai_suggestions[].suggested_title | string | 추천 제목 |
| ai_suggestions[].reason | string | 추천 이유 |

### UI 요소

```
── 마일스톤 ─────────────
┌───────────────────────┐
│ 🏆 마일스톤 모음 (12개)  │
│                        │
│ ┌──────┐ ┌──────┐     │   ← 그리드(2열) 카드
│ │ 📸   │ │ 📸   │     │
│ │줄넘기 │ │구구단 │     │
│ │100개  │ │외우기 │     │
│ │3/17   │ │2/28   │     │
│ └──────┘ └──────┘     │
│                        │
│ 💡 AI 추천              │
│ ┌───────────────────┐  │
│ │ "수학 100점 달성"이  │  │   ← AI 추천 마일스톤
│ │ 마일스톤이 될 수     │  │
│ │ 있어요! [등록하기]   │  │
│ └───────────────────┘  │
│          [+ 마일스톤]   │
└───────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 마일스톤 그리드 | 2열 그리드, 카드 높이 160px |
| 마일스톤 카드 | 상단: 사진(또는 유형 아이콘), 하단: 제목 + 날짜 |
| 유형 아이콘 | first(⭐), achievement(🏆), growth(🌱), custom(💫) |
| AI 추천 카드 | Info Light 배경, 추천 제목 + 이유 + [등록하기] 버튼 |
| 추천 닫기 | 카드 우상단 × 버튼 (무시 처리) |
| 추가 버튼 | "+ 마일스톤" Ghost 버튼 |
| 마일스톤 상세 | 탭 시 전체 화면 상세(사진 + 설명 + 연결 기록) |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-REC-03-01 | 마일스톤은 일반 기록과 별도로 관리하며, 기존 기록을 마일스톤으로 승격할 수 있다 |
| BL-REC-03-02 | AI 추천: 기록 중 "처음", "100", "달성", "성공" 등 키워드가 포함된 기록을 후보로 선정한다 |
| BL-REC-03-03 | AI 추천은 주 1회 배치로 생성하며, 최대 3개까지 표시한다 |
| BL-REC-03-04 | 추천을 무시(dismiss)하면 해당 기록은 다시 추천하지 않는다 |
| BL-REC-03-05 | 마일스톤 목록은 날짜 역순으로 정렬한다 |
| BL-REC-03-06 | 마일스톤 그리드 기본 표시 수: 4개. "전체보기" 링크로 확장 |
| BL-REC-03-07 | 연결된 기록이 삭제되어도 마일스톤은 유지된다 |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 마일스톤 없음 | "아이의 특별한 순간을 기록해보세요" + [첫 마일스톤 등록] 버튼 |
| AI 추천 없음 | 추천 섹션 숨김 |
| 사진 업로드 실패 | 사진 없이 텍스트만 저장 + "사진 업로드에 실패했습니다" 토스트 |
| 중복 마일스톤 (같은 기록) | "이미 이 기록으로 마일스톤이 등록되어 있습니다" |

### 관련 테이블

```sql
-- milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  milestone_date DATE NOT NULL,
  milestone_type VARCHAR(15) NOT NULL DEFAULT 'custom',   -- first, achievement, growth, custom
  image_url TEXT,
  storage_path TEXT,
  linked_record_id UUID REFERENCES records(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_child_date ON milestones(child_id, milestone_date DESC);

-- milestone_suggestions (AI 추천)
CREATE TABLE milestone_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  source_record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  suggested_title VARCHAR(100) NOT NULL,
  reason TEXT,
  status VARCHAR(10) DEFAULT 'pending',   -- pending, accepted, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestone_suggestions_child ON milestone_suggestions(child_id, status);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/milestones` | 마일스톤 목록 조회 |
| POST | `/api/v1/children/{child_id}/milestones` | 마일스톤 생성 |
| PUT | `/api/v1/children/{child_id}/milestones/{id}` | 마일스톤 수정 |
| DELETE | `/api/v1/children/{child_id}/milestones/{id}` | 마일스톤 삭제 |
| GET | `/api/v1/children/{child_id}/milestones/suggestions` | AI 추천 마일스톤 목록 |
| POST | `/api/v1/children/{child_id}/milestones/suggestions/{id}/accept` | 추천 수락 → 마일스톤 생성 |
| POST | `/api/v1/children/{child_id}/milestones/suggestions/{id}/dismiss` | 추천 무시 |

---

## REC-04: 독서 기록

### 기본 정보

| 항목 | 내용 |
|------|------|
| 기능 ID | REC-04 |
| 기능명 | 독서 기록 |
| 목적 | 아이가 읽은 책의 제목, 날짜, 시간, 카테고리, 메모를 체계적으로 기록하여 독서 습관 분석과 성장 데이터의 기반을 제공한다 |
| 우선순위 | **P0** |

### 사용자 스토리

| ID | 스토리 |
|----|--------|
| US-REC-04-01 | As a 부모, I want to 아이가 읽은 책 정보를 기록하고 싶다, so that 독서 이력을 체계적으로 관리할 수 있다 |
| US-REC-04-02 | As a 부모, I want to 독서 시간을 기록하고 싶다, so that 하루 독서 목표 달성률에 반영할 수 있다 |
| US-REC-04-03 | As a 부모, I want to 책을 분야별로 분류하고 싶다, so that 아이의 독서 편향을 파악할 수 있다 |
| US-REC-04-04 | As a 부모, I want to 책에 대한 짧은 메모를 남기고 싶다, so that 아이의 독서 반응을 기록할 수 있다 |
| US-REC-04-05 | As a 부모, I want to 이전에 기록한 책 제목을 자동완성으로 빠르게 선택하고 싶다, so that 같은 책을 계속 읽을 때 편리하다 |

### 입력 데이터

| 필드 | 타입 | 필수 | 설명 | 제약조건 |
|------|------|------|------|----------|
| title | string | Y | 책 제목 | 1~200자 |
| read_date | date | Y | 읽은 날짜 | 기본: 오늘, 미래 불가 |
| duration | integer | Y | 독서 시간 (분) | 1~480분 |
| category | enum | N | 분야 | science, fairy_tale, history, math, social, art, english, etc |
| memo | text | N | 메모/감상 | 최대 500자 |
| rating | integer | N | 별점 | 1~5 |
| pages_read | integer | N | 읽은 페이지 수 | 0~9999 |
| is_completed | boolean | N | 완독 여부 | 기본 false |

### 출력 데이터

| 필드 | 타입 | 설명 |
|------|------|------|
| reading_log_id | UUID | 독서 기록 ID |
| title_suggestions | string[] | 이전 기록 기반 자동완성 목록 |
| today_total_minutes | integer | 오늘 누적 독서 시간 |
| today_goal_progress | number | 오늘 목표 달성률 (%) |

### UI 요소

```
┌─────────────────────────────┐
│  ←    독서 기록      [저장]  │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 📖 책 제목              │  │   ← 자동완성 지원
│  │    예: 어린왕자          │  │
│  └───────────────────────┘  │
│                             │
│  날짜: 2026.03.18 (화) ▼    │
│                             │
│  ── 독서 시간 ────────────  │
│  ┌───────────────────────┐  │
│  │    ─  30분  ＋          │  │   ← 스텝퍼 (5분 단위)
│  └───────────────────────┘  │
│                             │
│  ── 분야 ─────────────────  │
│  [과학] [동화] [역사] [수학]  │   ← 카테고리 칩 (단일 선택)
│  [사회] [예술] [영어] [기타]  │
│                             │
│  ── 별점 ─────────────────  │
│  ☆ ☆ ☆ ☆ ☆                 │   ← 1~5 별점
│                             │
│  ┌───────────────────────┐  │
│  │ 메모 (선택)              │  │
│  │                        │  │
│  └───────────────────────┘  │
│                             │
│  □ 이 책을 다 읽었어요       │   ← 완독 체크박스
│                             │
└─────────────────────────────┘
```

| UI 구성 요소 | 설명 |
|-------------|------|
| 책 제목 입력 | 텍스트 입력, 자동완성 드롭다운 (기존 기록 제목 검색) |
| 자동완성 | 2자 이상 입력 시 드롭다운, 최대 5개 후보 |
| 날짜 선택 | Body L, 탭 시 DatePicker |
| 시간 스텝퍼 | 5분 단위 ＋/－ 버튼, 중앙에 현재 값, 직접 입력도 가능 |
| 분야 칩 | 단일 선택, 선택 시 Record 테마 배경 |
| 별점 | 5개 별, 탭으로 선택, 선택된 별은 Warning(#F59E0B) 채움 |
| 메모 입력 | 최소 높이 80px, 선택적 |
| 완독 체크박스 | 체크 시 해당 책을 완독 처리 |
| 저장 버튼 | 제목 + 시간 입력 시 활성 |

### 비즈니스 로직

| 규칙 ID | 규칙 설명 |
|---------|----------|
| BL-REC-04-01 | 제목과 독서 시간은 필수 입력이다 |
| BL-REC-04-02 | 자동완성: 해당 아이의 이전 reading_logs에서 title을 검색하여 중복 없이 표시한다 |
| BL-REC-04-03 | 자동완성에서 선택 시 이전 기록의 category도 자동 입력한다 |
| BL-REC-04-04 | 같은 날짜에 같은 책 제목으로 여러 기록 가능하다 (시간 합산) |
| BL-REC-04-05 | 시간 스텝퍼 기본값: 30분, 최소 단위: 5분 |
| BL-REC-04-06 | 저장 시 Home 화면의 "오늘의 독서" 위젯(HOME-03)에 즉시 반영한다 |
| BL-REC-04-07 | 저장 시 Growth 탭의 "독서 성장"(GROW-04)에도 반영한다 |
| BL-REC-04-08 | is_completed=true인 책은 독서 성장의 권수 카운트에 반영한다 |
| BL-REC-04-09 | 카테고리 미선택 시 AI가 제목 기반으로 자동 추천한다 (비동기) |
| BL-REC-04-10 | 독서 기록도 Record 탭의 타임라인에 함께 표시한다 (📚 아이콘으로 구분) |

### 예외/에러 처리

| 케이스 | 처리 방법 |
|--------|----------|
| 제목 미입력 | 저장 버튼 비활성 + 제목 필드 하이라이트 |
| 시간 0분 | "독서 시간을 입력해주세요" |
| 시간 480분 초과 | "독서 시간은 최대 8시간(480분)까지 입력 가능합니다" |
| 자동완성 로딩 실패 | 자동완성 없이 직접 입력 모드 |
| 저장 실패 | 토스트: "저장에 실패했습니다" + 재시도 버튼 |
| 미래 날짜 선택 | DatePicker에서 미래 날짜 비활성 처리 |

### 관련 테이블

```sql
-- reading_logs (확장)
CREATE TABLE reading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  read_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration INTEGER NOT NULL,            -- 분 단위
  category VARCHAR(20),                 -- science, fairy_tale, history, math, social, art, english, etc
  memo TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  pages_read INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reading_logs_child_date ON reading_logs(child_id, read_date DESC);
CREATE INDEX idx_reading_logs_title ON reading_logs(child_id, title);
CREATE INDEX idx_reading_logs_category ON reading_logs(child_id, category);
```

### 관련 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/children/{child_id}/reading-logs` | 독서 기록 목록 (페이지네이션, 필터) |
| POST | `/api/v1/children/{child_id}/reading-logs` | 독서 기록 생성 |
| PUT | `/api/v1/children/{child_id}/reading-logs/{id}` | 독서 기록 수정 |
| DELETE | `/api/v1/children/{child_id}/reading-logs/{id}` | 독서 기록 삭제 |
| GET | `/api/v1/children/{child_id}/reading-logs/autocomplete?q={query}` | 책 제목 자동완성 |
| GET | `/api/v1/children/{child_id}/reading-logs/stats?date={YYYY-MM-DD}` | 특정일 독서 통계 (오늘 누적 등) |

---

## Record 탭 진입점 정리

| 진입 경로 | 설명 |
|----------|------|
| 하단 네비게이션 → Record | 기록 목록(타임라인) 화면 진입 |
| Home → 플로팅 "오늘 기록하기" 버튼 | 새 기록 작성 화면 진입 |
| Record 목록 → FAB(＋ 기록) | 새 기록 작성 화면 진입 |
| Record 목록 → FAB → 독서 기록 | 독서 기록 작성 화면 진입 |
| 기록 카드 탭 | 기록 상세 보기 진입 |
| 기록 카드 long press → 수정 | 기록 수정 화면 진입 |
| 기록 상세 → "마일스톤으로 등록" | 마일스톤 생성 (기록 연결) |

## FAB 확장 메뉴

FAB(＋ 기록) 탭 시 확장되는 메뉴:

| 항목 | 아이콘 | 설명 |
|------|--------|------|
| 일상 기록 | 📝 | REC-01 새 기록 작성 |
| 독서 기록 | 📚 | REC-04 독서 기록 작성 |
| 마일스톤 | 🏆 | REC-03 마일스톤 등록 |
