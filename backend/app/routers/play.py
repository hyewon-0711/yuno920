from fastapi import APIRouter, Depends
from app.config import Settings, get_settings
from app.models.schemas import QuizGenerateRequest, QuizGenerateResponse

router = APIRouter()


@router.post("/generate-quiz", response_model=QuizGenerateResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    settings: Settings = Depends(get_settings),
):
    # TODO: OpenAI로 독서 기반 퀴즈 생성
    return QuizGenerateResponse(questions=[])
