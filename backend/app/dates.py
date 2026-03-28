"""앱에서 사용하는 캘린더/시각 기준 (배포 서버가 UTC여도 한국 기준 '오늘'이 맞도록)."""

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.config import get_settings


def app_tz() -> ZoneInfo:
    return ZoneInfo(get_settings().app_timezone)


def today_app() -> date:
    return datetime.now(app_tz()).date()


def local_day_start_end_iso(d: date) -> tuple[str, str]:
    """해당 로컬 날짜의 [00:00, 다음날 00:00) 을 ISO8601(+offset) 구간으로 반환. timestamptz 비교용."""
    tz = app_tz()
    start = datetime.combine(d, time.min, tzinfo=tz)
    end = start + timedelta(days=1)
    return start.isoformat(), end.isoformat()
