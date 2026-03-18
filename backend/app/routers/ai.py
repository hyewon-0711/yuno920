from fastapi import APIRouter, Depends
from app.models.schemas import ChatRequest, ChatResponse
from app.services.openai_service import OpenAIService
from app.config import Settings, get_settings

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, settings: Settings = Depends(get_settings)):
    service = OpenAIService(settings.openai_api_key)
    result = await service.chat(request.message)
    return ChatResponse(reply=result)
