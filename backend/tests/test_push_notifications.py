import unittest
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth_deps import get_current_user_id
from app.config import Settings, get_settings
from app.routers import notifications


class PushNotificationTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(notifications.router, prefix="/notifications")
        self.app.dependency_overrides[get_current_user_id] = lambda: "test-user"
        self.app.dependency_overrides[get_settings] = lambda: Settings(
            vapid_private_key="test-private-key",
            vapid_subject="mailto:test@yuno920.com",
        )
        self.client = TestClient(self.app)
        self.db = MagicMock()
        self.db.get_web_push_subscriptions.return_value = [
            {
                "id": "subscription-1",
                "endpoint": "https://push.example/subscription-1",
                "p256dh": "p256dh-key",
                "auth": "auth-key",
            }
        ]

    def tearDown(self):
        self.app.dependency_overrides.clear()

    @patch("app.routers.notifications.SupabaseService")
    def test_subscribe_stores_authenticated_user_subscription(self, service):
        response = self.client.post(
            "/notifications/push/subscribe",
            json={
                "endpoint": "https://push.example/subscription-1",
                "expiration_time": None,
                "keys": {"p256dh": "p256dh-key", "auth": "auth-key"},
            },
        )

        self.assertEqual(response.status_code, 200)
        service.return_value.upsert_web_push_subscription.assert_called_once_with(
            "test-user",
            {
                "endpoint": "https://push.example/subscription-1",
                "expiration_time": None,
                "keys": {"p256dh": "p256dh-key", "auth": "auth-key"},
            },
        )

    @patch("app.routers.notifications.webpush")
    @patch("app.routers.notifications.SupabaseService")
    def test_test_push_sends_to_registered_browser(self, service, send):
        service.return_value = self.db

        response = self.client.post("/notifications/push/test", json={})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"sent": 1, "removed": 0})
        send.assert_called_once()
        self.assertEqual(send.call_args.kwargs["subscription_info"]["endpoint"], "https://push.example/subscription-1")
        self.assertEqual(send.call_args.kwargs["vapid_private_key"], "test-private-key")

    def test_test_push_requires_vapid_configuration(self):
        self.app.dependency_overrides[get_settings] = lambda: Settings()

        response = self.client.post("/notifications/push/test", json={})

        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
