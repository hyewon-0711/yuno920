from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from app.config import Settings, get_settings
from app.dates import today_app
from app.services.openai_service import OpenAIService
from app.services.supabase_service import SupabaseService
from app.models.schemas import (
    ChatRequest, ChatResponse,
    ChatAssistantRequest, ChatAssistantResponse,
    DailySummaryRequest, DailySummaryResponse,
    ReportRequest, ReportResponse,
    CoachingRequest, CoachingResponse,
    PersonalityRequest, PersonalityResponse,
    HexagonRequest, HexagonResponse,
    GrowthAdviceRequest, GrowthAdviceResponse,
)

router = APIRouter()


def _get_child_age(birth_date_str: str) -> int:
    birth = date.fromisoformat(birth_date_str)
    today = today_app()
    return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, settings: Settings = Depends(get_settings)):
    service = OpenAIService(settings.openai_api_key)
    result = await service.chat(request.message)
    return ChatResponse(reply=result)


@router.post("/chat-assistant", response_model=ChatAssistantResponse)
async def chat_assistant(request: ChatAssistantRequest, settings: Settings = Depends(get_settings)):
    """아이 데이터(오늘 요일 주간 시간표, 일정, 기록, 독서) 기반 컨텍스트로 질문에 답변"""
    db = SupabaseService()
    child = db.get_child(request.child_id)
    if not child:
        raise HTTPException(status_code=404, detail="아이 프로필을 찾을 수 없습니다")

    today = today_app()
    today_str = today.strftime("%Y년 %m월 %d일 ") + ["월", "화", "수", "목", "금", "토", "일"][today.weekday()] + "요일"

    schedules = db.get_today_schedules(request.child_id)
    dow = today.weekday()
    weekly_today = db.get_weekly_timetable_for_weekday(request.child_id, dow)
    records_today = db.get_records_by_date(request.child_id, today)
    reading_today = db.get_reading_logs_by_date(request.child_id, today)
    recent_records = db.get_recent_records(request.child_id, days=3)
    recent_reading = db.get_recent_reading_logs(request.child_id, days=3)

    child_age = _get_child_age(child["birth_date"])
    ai = OpenAIService(settings.openai_api_key)
    reply = await ai.chat_with_context(
        child_name=child["name"],
        child_age=child_age,
        today_str=today_str,
        schedules=schedules,
        weekly_timetable_today=weekly_today,
        records_today=records_today,
        reading_today=reading_today,
        recent_records=recent_records,
        recent_reading=recent_reading,
        message=request.message,
    )
    return ChatAssistantResponse(reply=reply)


@router.post("/daily-summary", response_model=DailySummaryResponse)
async def daily_summary(request: DailySummaryRequest, settings: Settings = Depends(get_settings)):
    db = SupabaseService()
    child = db.get_child(request.child_id)
    if not child:
        raise HTTPException(status_code=404, detail="아이 프로필을 찾을 수 없습니다")

    records = db.get_records_by_date(request.child_id, request.target_date)
    reading_logs = db.get_reading_logs_by_date(request.child_id, request.target_date)

    if not records and not reading_logs:
        return DailySummaryResponse(
            summary=f"{child['name']}의 오늘 기록이 아직 없어요. 기록을 남겨주세요!",
            keywords=[],
        )

    ai = OpenAIService(settings.openai_api_key)
    result = await ai.generate_daily_summary(child["name"], records, reading_logs)

    db.save_ai_report(
        child_id=request.child_id,
        report_type="daily",
        content=result.get("summary", ""),
        metadata={"keywords": result.get("keywords", []), "mood": result.get("mood")},
        period_start=request.target_date,
        period_end=request.target_date,
    )

    return DailySummaryResponse(
        summary=result.get("summary", ""),
        mood=result.get("mood"),
        keywords=result.get("keywords", []),
    )


@router.post("/weekly-report", response_model=ReportResponse)
async def weekly_report(request: ReportRequest, settings: Settings = Depends(get_settings)):
    db = SupabaseService()
    child = db.get_child(request.child_id)
    if not child:
        raise HTTPException(status_code=404, detail="아이 프로필을 찾을 수 없습니다")

    ai = OpenAIService(settings.openai_api_key)
    records = db.get_recent_records(request.child_id, days=7)
    reading = db.get_recent_reading_logs(request.child_id, days=7)

    prompt = f"""{child['name']}의 주간 리포트를 작성해주세요.
기록 {len(records)}건, 독서 {len(reading)}건의 데이터가 있습니다.
300자 이내로 종합 분석과 격려를 포함해주세요."""

    content = await ai.chat(prompt)
    db.save_ai_report(
        child_id=request.child_id,
        report_type="weekly",
        content=content,
        metadata={"record_count": len(records), "reading_count": len(reading)},
        period_start=request.start_date,
        period_end=request.end_date,
    )

    return ReportResponse(content=content, metadata={"record_count": len(records), "reading_count": len(reading)})


@router.post("/monthly-report", response_model=ReportResponse)
async def monthly_report(request: ReportRequest, settings: Settings = Depends(get_settings)):
    db = SupabaseService()
    child = db.get_child(request.child_id)
    if not child:
        raise HTTPException(status_code=404, detail="아이 프로필을 찾을 수 없습니다")

    ai = OpenAIService(settings.openai_api_key)
    records = db.get_recent_records(request.child_id, days=30)
    reading = db.get_recent_reading_logs(request.child_id, days=30)

    prompt = f"""{child['name']}의 월간 리포트를 작성해주세요.
기록 {len(records)}건, 독서 {len(reading)}건의 데이터가 있습니다.
500자 이내로 성장 트렌드, 강점, 개선점을 분석해주세요."""

    content = await ai.chat(prompt)
    db.save_ai_report(
        child_id=request.child_id,
        report_type="monthly",
        content=content,
        metadata={"record_count": len(records), "reading_count": len(reading)},
        period_start=request.start_date,
        period_end=request.end_date,
    )

    return ReportResponse(content=content, metadata={"record_count": len(records), "reading_count": len(reading)})


@router.post("/coaching", response_model=CoachingResponse)
async def coaching(request: CoachingRequest, settings: Settings = Depends(get_settings)):
    db = SupabaseService()
    child = db.get_child(request.child_id)
    if not child:
        raise HTTPException(status_code=404, detail="아이 프로필을 찾을 수 없습니다")

    child_age = _get_child_age(child["birth_date"])
    schedules = db.get_today_schedules(request.child_id)
    recent_records = db.get_recent_records(request.child_id, days=3)
    recent_reading = db.get_recent_reading_logs(request.child_id, days=3)

    ai = OpenAIService(settings.openai_api_key)
    result = await ai.generate_coaching(
        child_name=child["name"],
        child_age=child_age,
        schedules=schedules,
        recent_records=recent_records,
        recent_reading=recent_reading,
    )

    return CoachingResponse(
        coaching=result["coaching"],
        tips=result.get("tips", []),
    )


@router.post("/personality", response_model=PersonalityResponse)
async def personality(request: PersonalityRequest, settings: Settings = Depends(get_settings)):
    ai = OpenAIService(settings.openai_api_key)

    birth_time_text = request.birth_time or "미입력"
    prompt = f"""아이의 생년월일({request.birth_date}), 출생시간({birth_time_text})을 기반으로
기질 및 성향 분석을 해주세요. 200자 이내, 긍정적인 톤으로 작성.
JSON: {{"analysis": "...", "traits": {{"외향성": 7, "감성": 8, "호기심": 9}}}}"""

    response = await ai.chat(prompt)

    import json
    try:
        result = json.loads(response)
    except (json.JSONDecodeError, ValueError):
        result = {"analysis": response, "traits": {}}

    return PersonalityResponse(analysis=result.get("analysis", response), traits=result.get("traits", {}))


@router.post("/hexagon", response_model=HexagonResponse)
async def hexagon(request: HexagonRequest, settings: Settings = Depends(get_settings)):
    db = SupabaseService()
    existing = db.get_hexagon_latest(request.child_id)
    if existing:
        return HexagonResponse(
            learning=existing["learning"],
            physical=existing["physical"],
            social=existing["social"],
            emotion=existing["emotion"],
            creativity=existing["creativity"],
            habit=existing["habit"],
        )
    return HexagonResponse(learning=50, physical=50, social=50, emotion=50, creativity=50, habit=50)


@router.post("/hexagon/calculate", response_model=HexagonResponse)
async def hexagon_calculate(request: HexagonRequest, settings: Settings = Depends(get_settings)):
    """AI 기반 6각형 역량 자동 산출 및 저장"""
    db = SupabaseService()
    records = db.get_recent_records(request.child_id, days=90)
    reading = db.get_reading_logs_for_period(request.child_id, months=3)
    growth = db.get_growth_metrics(request.child_id, months=3)
    schedules = db.get_today_schedules(request.child_id)
    sched_count = len(schedules) + 7  # rough proxy for schedule adherence

    ai = OpenAIService(settings.openai_api_key)
    scores = await ai.calculate_hexagon(records, reading, growth, sched_count)

    db.save_hexagon_scores(
        child_id=request.child_id,
        learning=scores["learning"],
        physical=scores["physical"],
        social=scores["social"],
        emotion=scores["emotion"],
        creativity=scores["creativity"],
        habit=scores["habit"],
    )

    return HexagonResponse(**scores)


@router.post("/growth-advice", response_model=GrowthAdviceResponse)
async def growth_advice(request: GrowthAdviceRequest, settings: Settings = Depends(get_settings)):
    ai = OpenAIService(settings.openai_api_key)
    areas_text = ", ".join(request.weak_areas) if request.weak_areas else "전반적 개선"

    prompt = f"""아이의 부족한 영역({areas_text})에 대한 개선 조언을 작성해주세요.
200자 이내 종합 조언 + 구체적인 활동 3가지를 번호로 나열해주세요.
예: 1. ~ 2. ~ 3. ~"""

    response = await ai.chat(prompt)
    import re
    recs = re.findall(r"\d+\.\s*([^\n\d]+)", response)
    return GrowthAdviceResponse(advice=response, recommendations=recs[:5] if recs else [])


@router.post("/auto-tag")
async def auto_tag(
    record_id: str,
    content: str,
    settings: Settings = Depends(get_settings),
):
    """기록 작성 후 자동 태깅 (프론트에서 비동기 호출)"""
    ai = OpenAIService(settings.openai_api_key)
    tags = await ai.auto_tag_record(content)

    if tags:
        db = SupabaseService()
        db.update_record_categories(record_id, tags)

    return {"record_id": record_id, "categories": tags}
