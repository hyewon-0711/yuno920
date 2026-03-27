"""Authenticated CRUD for app tables (Supabase via service role + JWT user checks)."""

from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import get_current_user_id, get_db, require_child_read, require_child_write
from app.services.supabase_service import SupabaseService

router = APIRouter()


def _time_hms(s: str) -> str:
    """HTML time 'HH:MM' 또는 'HH:MM:SS' → Postgres TIME 문자열."""
    s = s.strip()
    if len(s) == 5 and s[2] == ":":
        return f"{s}:00"
    return s[:8] if len(s) >= 8 else f"{s}:00"


# ---------- Schemas ----------

class ChildCreate(BaseModel):
    name: str
    birth_date: str
    gender: str
    birth_time: str | None = None
    avatar_url: str | None = None


class ScheduleCreate(BaseModel):
    title: str
    start_time: str
    repeat_type: str = "none"
    location: str | None = None
    end_time: str | None = None


class WeeklyTimetableCreate(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: str
    end_time: str
    title: str
    category: str = "other"
    notes: str | None = None
    color: str | None = None


class WeeklyTimetablePatch(BaseModel):
    day_of_week: int | None = Field(None, ge=0, le=6)
    start_time: str | None = None
    end_time: str | None = None
    title: str | None = None
    category: str | None = None
    notes: str | None = None
    color: str | None = None


class GrowthPhysicalCreate(BaseModel):
    height: float
    weight: float
    recorded_at: str
    memo: str | None = None


class GrowthLearningCreate(BaseModel):
    sr_score: int = Field(ge=0, le=100)
    recorded_at: str
    memo: str | None = None


class RecordCreate(BaseModel):
    content: str
    mood: str | None = None
    categories: list[str] = []
    photos: list[str] = []
    recorded_at: str | None = None


class RecordPatch(BaseModel):
    content: str | None = None
    mood: str | None = None


class ReadingLogCreate(BaseModel):
    title: str
    author: str | None = None
    duration_minutes: int = Field(gt=0)
    rating: int | None = None
    memo: str | None = None
    read_date: str
    category: str = "etc"


class ReadingLogPatch(BaseModel):
    title: str | None = None
    author: str | None = None
    duration_minutes: int | None = Field(None, gt=0)
    rating: int | None = None
    memo: str | None = None
    read_date: str | None = None
    category: str | None = None


class MilestoneCreate(BaseModel):
    title: str
    category: str = "etc"
    description: str | None = None
    photo_url: str | None = None
    milestone_date: str


class HexagonManual(BaseModel):
    learning: int = Field(ge=0, le=100)
    physical: int = Field(ge=0, le=100)
    social: int = Field(ge=0, le=100)
    emotion: int = Field(ge=0, le=100)
    creativity: int = Field(ge=0, le=100)
    habit: int = Field(ge=0, le=100)


# ---------- Me / Children ----------

@router.get("/me/child")
async def get_my_child(
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    res = db.client.table("children").select("*").eq("user_id", user_id).limit(1).execute()
    return res.data[0] if res.data else None


@router.post("/children")
async def create_child(
    body: ChildCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    if body.gender not in ("male", "female"):
        raise HTTPException(400, "gender must be male or female")
    bt = (body.birth_time or "").strip() or None
    row = {
        "user_id": user_id,
        "name": body.name.strip(),
        "birth_date": body.birth_date,
        "gender": body.gender,
        "birth_time": bt,
        "avatar_url": body.avatar_url,
    }
    try:
        res = db.client.table("children").insert(row).select("*").execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not res.data:
        raise HTTPException(
            status_code=400,
            detail="아이 프로필 저장에 실패했습니다. public.users에 계정이 있는지, DB 제약을 확인하세요.",
        )
    return res.data[0]


# ---------- Schedules ----------

@router.get("/children/{child_id}/schedules")
async def list_schedules_for_day(
    child_id: str,
    date: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    try:
        tomorrow = (datetime.fromisoformat(date) + timedelta(days=1)).date().isoformat()
    except ValueError:
        raise HTTPException(400, "Invalid date") from None
    res = (
        db.client.table("schedules")
        .select("*")
        .eq("child_id", child_id)
        .gte("start_time", f"{date}T00:00:00")
        .lt("start_time", f"{tomorrow}T00:00:00")
        .order("start_time")
        .execute()
    )
    return res.data or []


@router.post("/children/{child_id}/schedules")
async def create_schedule(
    child_id: str,
    body: ScheduleCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    row = {
        "child_id": child_id,
        "title": body.title.strip(),
        "start_time": body.start_time,
        "repeat_type": body.repeat_type,
        "location": body.location,
        "end_time": body.end_time,
    }
    res = db.client.table("schedules").insert(row).execute()
    return res.data[0] if res.data else {}


@router.delete("/children/{child_id}/schedules/{schedule_id}")
async def delete_schedule(
    child_id: str,
    schedule_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    chk = (
        db.client.table("schedules")
        .select("id")
        .eq("id", schedule_id)
        .eq("child_id", child_id)
        .limit(1)
        .execute()
    )
    if not chk.data:
        raise HTTPException(404)
    db.client.table("schedules").delete().eq("id", schedule_id).execute()
    return {"ok": True}


# ---------- Weekly timetable ----------

@router.get("/children/{child_id}/weekly-timetable")
async def list_weekly_timetable(
    child_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    res = (
        db.client.table("weekly_timetable")
        .select("*")
        .eq("child_id", child_id)
        .order("day_of_week")
        .order("start_time")
        .execute()
    )
    return res.data or []


@router.post("/children/{child_id}/weekly-timetable")
async def create_weekly_entry(
    child_id: str,
    body: WeeklyTimetableCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    row = {
        "child_id": child_id,
        "day_of_week": body.day_of_week,
        "start_time": _time_hms(body.start_time),
        "end_time": _time_hms(body.end_time),
        "title": body.title.strip(),
        "category": body.category,
        "notes": body.notes,
        "color": body.color,
    }
    res = db.client.table("weekly_timetable").insert(row).execute()
    return res.data[0] if res.data else {}


@router.patch("/weekly-timetable/{entry_id}")
async def patch_weekly_entry(
    entry_id: str,
    body: WeeklyTimetablePatch,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("weekly_timetable").select("child_id").eq("id", entry_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    patch: dict[str, Any] = {}
    if body.day_of_week is not None:
        patch["day_of_week"] = body.day_of_week
    if body.start_time is not None:
        patch["start_time"] = _time_hms(body.start_time)
    if body.end_time is not None:
        patch["end_time"] = _time_hms(body.end_time)
    if body.title is not None:
        patch["title"] = body.title.strip()
    if body.category is not None:
        patch["category"] = body.category
    if body.notes is not None:
        patch["notes"] = body.notes
    if body.color is not None:
        patch["color"] = body.color
    res = db.client.table("weekly_timetable").update(patch).eq("id", entry_id).execute()
    return res.data[0] if res.data else {}


@router.delete("/weekly-timetable/{entry_id}")
async def delete_weekly_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("weekly_timetable").select("child_id").eq("id", entry_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    db.client.table("weekly_timetable").delete().eq("id", entry_id).execute()
    return {"ok": True}


# ---------- Growth metrics ----------

@router.get("/children/{child_id}/growth-metrics")
async def list_growth_metrics(
    child_id: str,
    months: int = 12,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    start = (date.today() - timedelta(days=months * 31)).isoformat()
    res = (
        db.client.table("growth_metrics")
        .select("*")
        .eq("child_id", child_id)
        .gte("recorded_at", start)
        .order("recorded_at")
        .execute()
    )
    return res.data or []


@router.post("/children/{child_id}/growth-metrics/physical")
async def add_growth_physical(
    child_id: str,
    body: GrowthPhysicalCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    res = (
        db.client.table("growth_metrics")
        .insert(
            {
                "child_id": child_id,
                "height": body.height,
                "weight": body.weight,
                "recorded_at": body.recorded_at,
                "memo": body.memo,
            }
        )
        .execute()
    )
    return res.data[0] if res.data else {}


@router.post("/children/{child_id}/growth-metrics/learning")
async def add_growth_learning(
    child_id: str,
    body: GrowthLearningCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    res = (
        db.client.table("growth_metrics")
        .insert(
            {
                "child_id": child_id,
                "sr_score": body.sr_score,
                "recorded_at": body.recorded_at,
                "memo": body.memo,
            }
        )
        .execute()
    )
    return res.data[0] if res.data else {}


@router.delete("/growth-metrics/{metric_id}")
async def delete_growth_metric(
    metric_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("growth_metrics").select("child_id").eq("id", metric_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    db.client.table("growth_metrics").delete().eq("id", metric_id).execute()
    return {"ok": True}


# ---------- Records ----------

@router.get("/children/{child_id}/records")
async def list_records(
    child_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    res = (
        db.client.table("records")
        .select("*")
        .eq("child_id", child_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data or []


@router.get("/records/{record_id}")
async def get_record(
    record_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    res = db.client.table("records").select("*").eq("id", record_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404)
    require_child_read(db, user_id, res.data[0]["child_id"])
    return res.data[0]


@router.post("/children/{child_id}/records")
async def create_record(
    child_id: str,
    body: RecordCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    rec_at = body.recorded_at or date.today().isoformat()
    row = {
        "child_id": child_id,
        "user_id": user_id,
        "content": body.content.strip(),
        "mood": body.mood,
        "categories": body.categories,
        "photos": body.photos,
        "recorded_at": rec_at,
    }
    res = db.client.table("records").insert(row).execute()
    return res.data[0] if res.data else {}


@router.patch("/records/{record_id}")
async def patch_record(
    record_id: str,
    body: RecordPatch,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("records").select("child_id").eq("id", record_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    patch: dict[str, Any] = {}
    if body.content is not None:
        patch["content"] = body.content.strip()
    if body.mood is not None:
        patch["mood"] = body.mood
    res = db.client.table("records").update(patch).eq("id", record_id).execute()
    return res.data[0] if res.data else {}


@router.delete("/records/{record_id}")
async def delete_record(
    record_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("records").select("child_id").eq("id", record_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    db.client.table("records").delete().eq("id", record_id).execute()
    return {"ok": True}


# ---------- Reading logs ----------

@router.get("/children/{child_id}/reading-logs")
async def list_reading_logs(
    child_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    res = (
        db.client.table("reading_logs")
        .select("*")
        .eq("child_id", child_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data or []


@router.post("/children/{child_id}/reading-logs")
async def create_reading_log(
    child_id: str,
    body: ReadingLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    row = {
        "child_id": child_id,
        "title": body.title.strip(),
        "author": body.author,
        "duration_minutes": body.duration_minutes,
        "rating": body.rating,
        "memo": body.memo,
        "read_date": body.read_date,
        "category": body.category,
    }
    res = db.client.table("reading_logs").insert(row).execute()
    return res.data[0] if res.data else {}


@router.patch("/reading-logs/{log_id}")
async def patch_reading_log(
    log_id: str,
    body: ReadingLogPatch,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("reading_logs").select("child_id").eq("id", log_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    patch = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "title" in patch and isinstance(patch["title"], str):
        patch["title"] = patch["title"].strip()
    res = db.client.table("reading_logs").update(patch).eq("id", log_id).execute()
    return res.data[0] if res.data else {}


@router.delete("/reading-logs/{log_id}")
async def delete_reading_log(
    log_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("reading_logs").select("child_id").eq("id", log_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    db.client.table("reading_logs").delete().eq("id", log_id).execute()
    return {"ok": True}


@router.get("/children/{child_id}/reading-logs/today-summary")
async def reading_today_summary(
    child_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    today = date.today().isoformat()
    res = (
        db.client.table("reading_logs")
        .select("title, duration_minutes")
        .eq("child_id", child_id)
        .eq("read_date", today)
        .order("created_at", desc=True)
        .execute()
    )
    logs = res.data or []
    total = sum((x.get("duration_minutes") or 0) for x in logs)
    return {
        "totalMinutes": total,
        "bookCount": len(logs),
        "recentBook": logs[0]["title"] if logs else None,
        "goalMinutes": 30,
        "goalBooks": 1,
    }


@router.get("/children/{child_id}/reading-logs/monthly-summary")
async def reading_monthly_summary(
    child_id: str,
    months: int = 6,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    start = date.today() - timedelta(days=months * 31)
    start_str = start.isoformat()
    res = (
        db.client.table("reading_logs")
        .select("read_date, duration_minutes")
        .eq("child_id", child_id)
        .gte("read_date", start_str)
        .order("read_date")
        .execute()
    )
    logs = res.data or []
    by_month: dict[str, dict[str, int]] = {}
    for row in logs:
        rd = str(row["read_date"])
        month = rd[:7]
        if month not in by_month:
            by_month[month] = {"minutes": 0, "count": 0}
        by_month[month]["minutes"] += int(row.get("duration_minutes") or 0)
        by_month[month]["count"] += 1
    out = [
        {"month": m, "totalMinutes": v["minutes"], "bookCount": v["count"]}
        for m, v in sorted(by_month.items())
    ]
    return out


# ---------- Milestones ----------

@router.get("/children/{child_id}/milestones")
async def list_milestones(
    child_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    res = (
        db.client.table("milestones")
        .select("*")
        .eq("child_id", child_id)
        .order("milestone_date", desc=True)
        .execute()
    )
    return res.data or []


@router.post("/children/{child_id}/milestones")
async def create_milestone(
    child_id: str,
    body: MilestoneCreate,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    row = {
        "child_id": child_id,
        "title": body.title.strip(),
        "category": body.category,
        "description": body.description,
        "photo_url": body.photo_url,
        "milestone_date": body.milestone_date,
    }
    res = db.client.table("milestones").insert(row).execute()
    return res.data[0] if res.data else {}


@router.delete("/milestones/{milestone_id}")
async def delete_milestone(
    milestone_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    r = db.client.table("milestones").select("child_id").eq("id", milestone_id).limit(1).execute()
    if not r.data:
        raise HTTPException(404)
    require_child_write(db, user_id, r.data[0]["child_id"])
    db.client.table("milestones").delete().eq("id", milestone_id).execute()
    return {"ok": True}


# ---------- Hexagon ----------

@router.get("/children/{child_id}/hexagon/latest")
async def hexagon_latest(
    child_id: str,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_read(db, user_id, child_id)
    res = (
        db.client.table("hexagon_scores")
        .select("*")
        .eq("child_id", child_id)
        .order("calculated_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    d = res.data[0]
    return {
        "learning": d["learning"],
        "physical": d["physical"],
        "social": d["social"],
        "emotion": d["emotion"],
        "creativity": d["creativity"],
        "habit": d["habit"],
    }


@router.post("/children/{child_id}/hexagon")
async def hexagon_save_manual(
    child_id: str,
    body: HexagonManual,
    user_id: str = Depends(get_current_user_id),
    db: SupabaseService = Depends(get_db),
):
    require_child_write(db, user_id, child_id)
    row = {
        "child_id": child_id,
        "learning": body.learning,
        "physical": body.physical,
        "social": body.social,
        "emotion": body.emotion,
        "creativity": body.creativity,
        "habit": body.habit,
    }
    res = db.client.table("hexagon_scores").insert(row).execute()
    return res.data[0] if res.data else {}
