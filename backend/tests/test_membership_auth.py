import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from app.auth_deps import get_authenticated_user_id, get_current_user_id


class MembershipAuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()

        @self.app.get("/protected")
        def protected(user_id: str = Depends(get_current_user_id)):
            return {"user_id": user_id}

        self.app.dependency_overrides[get_authenticated_user_id] = lambda: "test-user"
        self.client = TestClient(self.app)
        self.patch = patch("app.services.supabase_service.get_supabase_client")
        self.factory = self.patch.start()
        self.db = MagicMock()
        self.factory.return_value = self.db
        self.addCleanup(self.patch.stop)

    def test_approved_member_can_access(self):
        self.db.rpc.return_value.execute.return_value = SimpleNamespace(data=True)
        response = self.client.get("/protected")
        self.assertEqual(response.status_code, 200)
        self.db.rpc.assert_called_once_with("is_user_approved", {"p_user_id": "test-user"})

    def test_missing_or_unapproved_membership_is_denied(self):
        for result in (False, None, [], "true", 1):
            with self.subTest(result=result):
                self.db.rpc.return_value.execute.return_value = SimpleNamespace(data=result)
                self.assertEqual(self.client.get("/protected").status_code, 403)

    def test_database_failure_fails_closed(self):
        self.db.rpc.return_value.execute.side_effect = RuntimeError("private database detail")
        response = self.client.get("/protected")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private database detail", response.text)

    def test_revocation_applies_to_an_existing_login(self):
        self.db.rpc.return_value.execute.side_effect = [SimpleNamespace(data=True), SimpleNamespace(data=False)]
        self.assertEqual(self.client.get("/protected").status_code, 200)
        self.assertEqual(self.client.get("/protected").status_code, 403)

    def test_missing_bearer_token_is_denied_before_database(self):
        self.app.dependency_overrides.clear()
        response = self.client.get("/protected")
        self.assertIn(response.status_code, (401, 503))
        self.factory.assert_not_called()


if __name__ == "__main__":
    unittest.main()
