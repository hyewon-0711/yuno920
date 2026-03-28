from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from app.config import Settings, get_settings
from app.dates import today_app
from app.models.schemas import QuizGenerateRequest, QuizGenerateResponse, QuizQuestion
from app.services.openai_service import OpenAIService
from app.services.supabase_service import SupabaseService

router = APIRouter()


def _get_child_age(birth_date_str: str) -> int:
    try:
        birth = date.fromisoformat(birth_date_str)
        today = today_app()
        return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
    except (ValueError, TypeError):
        return 8


@router.post("/generate-quiz", response_model=QuizGenerateResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    settings: Settings = Depends(get_settings),
):
    db = SupabaseService()
    child = db.get_child(request.child_id)
    child_age = _get_child_age(child.get("birth_date", "") or "") if child else 8

    ai = OpenAIService(settings.openai_api_key)
    raw = await ai.generate_quiz(
        category=request.category,
        child_age=child_age,
        count=5,
    )
    questions = [
        QuizQuestion(
            question=q["question"],
            options=q["options"],
            answer=q["answer"],
            explanation=q.get("explanation"),
        )
        for q in raw
    ]
    return QuizGenerateResponse(questions=questions)
