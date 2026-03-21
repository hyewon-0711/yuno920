from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


# ========== Common ==========
class ChildIdRequest(BaseModel):
    child_id: str


class DateRangeRequest(BaseModel):
    child_id: str
    start_date: date
    end_date: date


# ========== AI Chat ==========
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


# ========== AI Daily Summary ==========
class DailySummaryRequest(BaseModel):
    child_id: str
    target_date: date


class DailySummaryResponse(BaseModel):
    summary: str
    mood: Optional[str] = None
    keywords: list[str] = []


# ========== AI Weekly/Monthly Report ==========
class ReportRequest(BaseModel):
    child_id: str
    start_date: date
    end_date: date


class ReportResponse(BaseModel):
    content: str
    metadata: dict = {}


# ========== AI Coaching ==========
class CoachingRequest(BaseModel):
    child_id: str
    context: Optional[str] = None


class CoachingResponse(BaseModel):
    coaching: str
    tips: list[str] = []


# ========== AI Personality ==========
class PersonalityRequest(BaseModel):
    child_id: str
    birth_date: date
    birth_time: Optional[str] = None


class PersonalityResponse(BaseModel):
    analysis: str
    traits: dict = {}


# ========== AI Hexagon ==========
class HexagonRequest(BaseModel):
    child_id: str


class HexagonResponse(BaseModel):
    learning: int = Field(ge=0, le=100)
    physical: int = Field(ge=0, le=100)
    social: int = Field(ge=0, le=100)
    emotion: int = Field(ge=0, le=100)
    creativity: int = Field(ge=0, le=100)
    habit: int = Field(ge=0, le=100)


# ========== AI Growth Advice ==========
class GrowthAdviceRequest(BaseModel):
    child_id: str
    weak_areas: list[str] = []


class GrowthAdviceResponse(BaseModel):
    advice: str
    recommendations: list[str] = []


# ========== External Weather ==========
class WeatherResponse(BaseModel):
    temperature: float
    description: str
    icon: str


# ========== External Meal ==========
class MealResponse(BaseModel):
    date: str
    menu: list[str] = []


# ========== Play Quiz (상식 퀴즈) ==========
class QuizGenerateRequest(BaseModel):
    child_id: str
    category: str  # 과학, 역사, 자연, 동물, 스포츠, 음식, 한국상식, 세계상식, 인물, 문화예술


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    answer: int
    explanation: str | None = None


class QuizGenerateResponse(BaseModel):
    questions: list[QuizQuestion] = []
