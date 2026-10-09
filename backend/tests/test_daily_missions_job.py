import unittest
from datetime import date
from unittest.mock import patch

from app.config import Settings
from app.jobs.daily_missions import run_daily_mission_job
from app.services.daily_missions import pick_daily_missions


TEMPLATES = [
    {
        "id": f"{area}-{index}",
        "title": f"{area}-{index}",
        "description": "description",
        "area": area,
        "estimated_minutes": 10,
        "is_bonus": area in {"creative", "habit"},
    }
    for area in ("physical", "learning", "social", "creative", "habit")
    for index in range(2)
]


class FakeDatabase:
    def __init__(self, existing=None):
        self.existing = existing or []
        self.upserted = []

    def get_active_mission_templates(self):
        return TEMPLATES

    def get_approved_memberships(self):
        return [{"user_id": "user-1"}, {"user_id": "user-2"}]

    def get_children_for_users(self, user_ids):
        self.requested_user_ids = user_ids
        return [
            {"id": "child-1", "user_id": "user-1"},
            {"id": "child-2", "user_id": "user-2"},
        ]

    def get_daily_missions_for_date(self, target_date):
        return self.existing

    def upsert_daily_missions(self, rows):
        self.upserted = rows


class DailyMissionJobTests(unittest.TestCase):
    def test_selection_is_stable_and_contains_five_slots(self):
        first = pick_daily_missions("child-1", date(2026, 10, 9), TEMPLATES)
        second = pick_daily_missions("child-1", date(2026, 10, 9), TEMPLATES)

        self.assertEqual(first, second)
        self.assertEqual([mission["slot"] for mission in first], [0, 1, 2, 3, 4])
        self.assertEqual(len({mission["template_id"] for mission in first}), 5)

    @patch("app.jobs.daily_missions.send_push_to_user")
    def test_job_upserts_missions_and_notifies_new_users(self, send_push):
        send_push.return_value = type("PushResult", (), {"sent": 1, "removed": 0})()
        db = FakeDatabase()
        settings = Settings(vapid_private_key="private", vapid_subject="mailto:test@yuno920.com")

        summary = run_daily_mission_job(date(2026, 10, 9), db, settings)

        self.assertEqual(len(db.upserted), 10)
        self.assertEqual(summary["users_notified"], 2)
        self.assertEqual(summary["push_sent"], 2)
        self.assertEqual(send_push.call_count, 2)

    @patch("app.jobs.daily_missions.send_push_to_user")
    def test_existing_day_does_not_send_duplicate_push(self, send_push):
        db = FakeDatabase(existing=[{"child_id": "child-1", "slot": 0}])
        settings = Settings(vapid_private_key="private", vapid_subject="mailto:test@yuno920.com")

        summary = run_daily_mission_job(date(2026, 10, 9), db, settings)

        self.assertEqual(summary["users_notified"], 1)
        self.assertEqual(send_push.call_count, 1)


if __name__ == "__main__":
    unittest.main()
