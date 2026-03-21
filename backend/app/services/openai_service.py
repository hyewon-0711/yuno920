from openai import AsyncOpenAI


class OpenAIService:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def chat(self, message: str) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": message},
            ],
        )
        return response.choices[0].message.content or ""

    async def generate_coaching(
        self,
        child_name: str,
        child_age: int,
        schedules: list[dict],
        recent_records: list[dict],
        recent_reading: list[dict],
    ) -> dict:
        schedule_text = ", ".join(s.get("title", "") for s in schedules) if schedules else "등록된 일정 없음"
        mood_text = ", ".join(r.get("mood", "보통") for r in recent_records[:3]) if recent_records else "기록 없음"
        reading_text = ", ".join(r.get("title", "") for r in recent_reading[:3]) if recent_reading else "독서 기록 없음"

        prompt = f"""당신은 따뜻하고 실용적인 육아 AI 코치입니다.
아래 정보를 기반으로 오늘의 맞춤 코칭을 작성해주세요.

아이 이름: {child_name}
나이: 만 {child_age}세
오늘 일정: {schedule_text}
최근 감정 상태: {mood_text}
최근 독서: {reading_text}

규칙:
- 존댓말(~요 체) 사용
- 아이 이름을 포함
- 총 100~150자 이내
- 구체적인 활동 1개, 대화 주제 1개를 포함
- JSON 형태로 응답: {{"coaching": "...", "tips": ["tip1", "tip2"]}}
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 육아 전문 AI 코치입니다. JSON만 출력하세요."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        import json
        try:
            result = json.loads(response.choices[0].message.content or "{}")
            return {
                "coaching": result.get("coaching", f"오늘도 {child_name}와(과) 행복한 하루 보내세요!"),
                "tips": result.get("tips", []),
            }
        except json.JSONDecodeError:
            return {
                "coaching": f"오늘도 {child_name}와(과) 행복한 하루 보내세요!",
                "tips": [],
            }

    async def auto_tag_record(self, content: str) -> list[str]:
        """기록 텍스트를 분석하여 카테고리 태그를 자동 추출"""
        prompt = f"""아래 아이 일상 기록을 분석하여 해당하는 카테고리를 JSON 배열로 반환하세요.
가능한 카테고리: health, meal, learning, play, emotion, reading, milestone

기록: "{content}"

규칙:
- 해당하는 카테고리만 배열에 포함
- 최소 1개, 최대 3개
- JSON 배열만 출력: ["category1", "category2"]
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "카테고리 분류 AI입니다. JSON 배열만 출력하세요."},
                {"role": "user", "content": prompt},
            ],
        )

        import json
        try:
            text = response.choices[0].message.content or "[]"
            start = text.index("[")
            end = text.rindex("]") + 1
            tags = json.loads(text[start:end])
            valid = {"health", "meal", "learning", "play", "emotion", "reading", "milestone"}
            return [t for t in tags if t in valid]
        except (json.JSONDecodeError, ValueError):
            return []

    async def generate_daily_summary(
        self,
        child_name: str,
        records: list[dict],
        reading_logs: list[dict],
    ) -> dict:
        record_texts = [f"- {r.get('content', '')} (감정: {r.get('mood', '없음')})" for r in records]
        reading_texts = [f"- {r.get('title', '')} ({r.get('duration_minutes', 0)}분)" for r in reading_logs]

        prompt = f"""아래 데이터를 기반으로 {child_name}의 하루 요약을 작성하세요.

기록:
{chr(10).join(record_texts) if record_texts else '기록 없음'}

독서:
{chr(10).join(reading_texts) if reading_texts else '독서 기록 없음'}

규칙:
- 200자 이내로 따뜻한 톤
- 아이 이름 포함
- 핵심 키워드 3개 추출
- JSON: {{"summary": "...", "mood": "happy|neutral|sad", "keywords": ["k1","k2","k3"]}}
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "하루 요약 AI입니다. JSON만 출력하세요."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        import json
        try:
            return json.loads(response.choices[0].message.content or "{}")
        except json.JSONDecodeError:
            return {"summary": "오늘의 기록을 요약할 수 없습니다.", "keywords": []}

    async def calculate_hexagon(
        self,
        records: list[dict],
        reading_logs: list[dict],
        growth_metrics: list[dict],
        schedules_count: int,
    ) -> dict:
        """6각형 역량 점수 AI 산출 (0~100)"""
        record_preview = ", ".join((r.get("content", "") or "")[:30] for r in records[:5]) if records else ""
        record_summary = f"기록 {len(records)}건" + (f": {record_preview}..." if record_preview else "")
        reading_summary = f"독서 {len(reading_logs)}건, 총 {sum(r.get('duration_minutes', 0) for r in reading_logs)}분" if reading_logs else "독서 없음"
        growth_summary = f"성장 기록 {len(growth_metrics)}건 (키/몸무게/SR)" if growth_metrics else "성장 기록 없음"

        prompt = f"""아이의 성장 데이터를 분석하여 6개 영역 역량 점수(0~100)를 산출하세요.

데이터:
- 일상 기록: {record_summary}
- 독서: {reading_summary}
- 성장 지표: {growth_summary}
- 일정 이행: {schedules_count}건

6개 영역: learning(학습), physical(신체), social(사회성), emotion(감정), creativity(창의성), habit(습관)

규칙:
- 데이터가 없으면 50점
- 각 영역 0~100 정수
- JSON만 출력: {{"learning": 60, "physical": 70, "social": 55, "emotion": 65, "creativity": 50, "habit": 45}}
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "6각형 역량 분석 AI입니다. JSON만 출력하세요."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        import json
        try:
            result = json.loads(response.choices[0].message.content or "{}")
            return {
                "learning": min(100, max(0, int(result.get("learning", 50)))),
                "physical": min(100, max(0, int(result.get("physical", 50)))),
                "social": min(100, max(0, int(result.get("social", 50)))),
                "emotion": min(100, max(0, int(result.get("emotion", 50)))),
                "creativity": min(100, max(0, int(result.get("creativity", 50)))),
                "habit": min(100, max(0, int(result.get("habit", 50)))),
            }
        except (json.JSONDecodeError, ValueError, TypeError):
            return {"learning": 50, "physical": 50, "social": 50, "emotion": 50, "creativity": 50, "habit": 50}

    async def generate_quiz(self, category: str, child_age: int = 8, count: int = 5) -> list[dict]:
        """상식 퀴즈 생성 (선택한 영역에 대해)"""
        import json
        prompt = f"""당신은 초등학생(만 {child_age}세) 아이를 위한 상식 퀴즈 출제자입니다.
"{category}" 영역에 대한 객관식 퀴즈를 {count}개 만들어주세요.

규칙:
- 아이가 이해할 수 있는 쉬운 말 사용
- 4지선다
- answer는 0~3 중 정답 인덱스
- 각 문제에 짧은 설명(explanation) 추가

다음 JSON 배열 형태로만 출력하세요 (다른 텍스트 없이):
[
  {{"question": "문제1", "options": ["보기1","보기2","보기3","보기4"], "answer": 0, "explanation": "설명"}},
  {{"question": "문제2", "options": ["보기1","보기2","보기3","보기4"], "answer": 2, "explanation": "설명"}}
]
"""
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "상식 퀴즈 출제 AI입니다. JSON 배열만 출력하세요."},
                {"role": "user", "content": prompt},
            ],
        )
        text = response.choices[0].message.content or "[]"
        try:
            start = text.index("[")
            end = text.rindex("]") + 1
            questions = json.loads(text[start:end])
            result = []
            for q in questions[:count]:
                opt = q.get("options", [])
                ans = int(q.get("answer", 0)) % max(1, len(opt))
                result.append({
                    "question": str(q.get("question", "")),
                    "options": [str(o) for o in opt][:4],
                    "answer": ans,
                    "explanation": str(q.get("explanation", "")) if q.get("explanation") else None,
                })
            return result
        except (json.JSONDecodeError, ValueError, IndexError):
            return []
