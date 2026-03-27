from datetime import date, timedelta
from supabase import create_client, Client
from app.config import get_settings


def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


class SupabaseService:
    def __init__(self):
        self.client = get_supabase_client()

    def get_child(self, child_id: str) -> dict | None:
        res = self.client.table("children").select("*").eq("id", child_id).limit(1).execute()
        return res.data[0] if res.data else None

    def get_today_schedules(self, child_id: str) -> list[dict]:
        today = date.today().isoformat()
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        res = (
            self.client.table("schedules")
            .select("*")
            .eq("child_id", child_id)
            .gte("start_time", f"{today}T00:00:00")
            .lt("start_time", f"{tomorrow}T00:00:00")
            .order("start_time")
            .execute()
        )
        return res.data or []

    def get_weekly_timetable_for_weekday(self, child_id: str, day_of_week: int) -> list[dict]:
        """주간 고정 시간표 중 특정 요일 (0=월..6=일, Python date.weekday()와 동일)."""
        res = (
            self.client.table("weekly_timetable")
            .select("start_time,end_time,title,category,notes,sort_order")
            .eq("child_id", child_id)
            .eq("day_of_week", day_of_week)
            .order("start_time")
            .execute()
        )
        rows = res.data or []
        rows.sort(key=lambda r: (str(r.get("start_time") or ""), r.get("sort_order") or 0))
        return rows

    def get_recent_records(self, child_id: str, days: int = 3) -> list[dict]:
        start = (date.today() - timedelta(days=days)).isoformat()
        res = (
            self.client.table("records")
            .select("*")
            .eq("child_id", child_id)
            .gte("recorded_at", start)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        return res.data or []

    def get_records_by_date(self, child_id: str, target_date: date) -> list[dict]:
        res = (
            self.client.table("records")
            .select("*")
            .eq("child_id", child_id)
            .eq("recorded_at", target_date.isoformat())
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def get_recent_reading_logs(self, child_id: str, days: int = 3) -> list[dict]:
        start = (date.today() - timedelta(days=days)).isoformat()
        res = (
            self.client.table("reading_logs")
            .select("*")
            .eq("child_id", child_id)
            .gte("read_date", start)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        return res.data or []

    def get_reading_logs_by_date(self, child_id: str, target_date: date) -> list[dict]:
        res = (
            self.client.table("reading_logs")
            .select("*")
            .eq("child_id", child_id)
            .eq("read_date", target_date.isoformat())
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def save_ai_report(self, child_id: str, report_type: str, content: str, metadata: dict,
                       period_start: date | None = None, period_end: date | None = None):
        self.client.table("ai_reports").insert({
            "child_id": child_id,
            "report_type": report_type,
            "content": content,
            "metadata": metadata,
            "period_start": period_start.isoformat() if period_start else None,
            "period_end": period_end.isoformat() if period_end else None,
        }).execute()

    def update_record_categories(self, record_id: str, categories: list[str]):
        self.client.table("records").update({
            "categories": categories,
        }).eq("id", record_id).execute()

    def get_hexagon_latest(self, child_id: str) -> dict | None:
        res = (
            self.client.table("hexagon_scores")
            .select("*")
            .eq("child_id", child_id)
            .order("calculated_at", desc=True)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    def save_hexagon_scores(
        self,
        child_id: str,
        learning: int,
        physical: int,
        social: int,
        emotion: int,
        creativity: int,
        habit: int,
    ):
        self.client.table("hexagon_scores").insert({
            "child_id": child_id,
            "learning": learning,
            "physical": physical,
            "social": social,
            "emotion": emotion,
            "creativity": creativity,
            "habit": habit,
        }).execute()

    def get_growth_metrics(self, child_id: str, months: int = 12) -> list[dict]:
        start = (date.today() - timedelta(days=months * 31)).isoformat()
        res = (
            self.client.table("growth_metrics")
            .select("*")
            .eq("child_id", child_id)
            .gte("recorded_at", start)
            .order("recorded_at")
            .execute()
        )
        return res.data or []

    def get_reading_logs_for_period(self, child_id: str, months: int = 6) -> list[dict]:
        start = (date.today() - timedelta(days=months * 31)).isoformat()
        res = (
            self.client.table("reading_logs")
            .select("*")
            .eq("child_id", child_id)
            .gte("read_date", start)
            .order("read_date")
            .execute()
        )
        return res.data or []
