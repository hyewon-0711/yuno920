import logging
from datetime import date

from app.config import Settings, get_settings
from app.dates import today_app
from app.routers.notifications import send_push_to_user
from app.services.daily_missions import SLOT_PLAN, pick_daily_missions
from app.services.supabase_service import SupabaseService


logger = logging.getLogger(__name__)


def _validate_templates(templates: list[dict]) -> None:
    missing_areas = [
        area for area, _is_bonus in SLOT_PLAN
        if not any(template.get("area") == area for template in templates)
    ]
    if missing_areas:
        raise RuntimeError(f"Missing active mission templates for: {', '.join(missing_areas)}")


def run_daily_mission_job(
    target_date: date | None = None,
    db: SupabaseService | None = None,
    settings: Settings | None = None,
) -> dict[str, int | str]:
    """Generate today's missions and notify users who received new missions."""
    target_date = target_date or today_app()
    db = db or SupabaseService()
    settings = settings or get_settings()

    templates = db.get_active_mission_templates()
    _validate_templates(templates)

    approved_memberships = db.get_approved_memberships()
    approved_user_ids = {
        str(row["user_id"])
        for row in approved_memberships
        if row.get("user_id")
    }
    children = db.get_children_for_users(sorted(approved_user_ids))
    existing_rows = db.get_daily_missions_for_date(target_date)
    existing_child_ids = {str(row["child_id"]) for row in existing_rows if row.get("child_id")}

    rows_to_upsert: list[dict] = []
    users_with_new_missions: set[str] = set()
    for child in children:
        child_id = str(child.get("id") or "")
        user_id = str(child.get("user_id") or "")
        if not child_id or not user_id:
            continue
        rows_to_upsert.extend(
            {
                "child_id": child_id,
                **mission,
            }
            for mission in pick_daily_missions(child_id, target_date, templates)
        )
        if child_id not in existing_child_ids:
            users_with_new_missions.add(user_id)

    db.upsert_daily_missions(rows_to_upsert)

    push_sent = 0
    push_removed = 0
    push_failures = 0
    if users_with_new_missions and settings.vapid_private_key and settings.vapid_subject:
        payload = {
            "title": "오늘의 미션이 도착했어요",
            "body": "아이와 함께 오늘의 미션을 시작해 보세요.",
            "url": "/play/missions",
            "tag": f"daily-missions-{target_date.isoformat()}",
        }
        for user_id in sorted(users_with_new_missions):
            try:
                result = send_push_to_user(user_id, payload, settings)
                push_sent += result.sent
                push_removed += result.removed
            except Exception:
                push_failures += 1
                logger.exception("Daily mission push failed for user %s", user_id)
    elif users_with_new_missions:
        logger.warning("Skipping daily mission push because VAPID settings are missing")

    summary: dict[str, int | str] = {
        "mission_date": target_date.isoformat(),
        "approved_users": len(approved_user_ids),
        "children": len(children),
        "missions_upserted": len(rows_to_upsert),
        "users_notified": len(users_with_new_missions),
        "push_sent": push_sent,
        "push_removed": push_removed,
        "push_failures": push_failures,
    }
    logger.info("Daily mission job finished: %s", summary)
    return summary


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    run_daily_mission_job()


if __name__ == "__main__":
    main()
