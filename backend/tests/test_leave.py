import unittest
from flask import Flask

from backend import campaigns
from backend.config import settings


class LeaveCampaignTest(unittest.TestCase):
    def setUp(self):
        # Use a file-backed SQLite DB for tests to avoid multiple-connection in-memory isolation
        settings.DATABASE_URL = "sqlite:///tmp_test.db"
        # remove any previous test DB to ensure a clean slate
        import os
        try:
            os.remove('tmp_test.db')
        except FileNotFoundError:
            pass
        # Recreate engine and tables under the test DB
        self.engine = campaigns._engine()
        campaigns.metadata.create_all(self.engine)

        # Seed a campaign, membership and a user_settings row with active campaign
        self.cid = "c_test"
        self.user_id = "user_1"
        with self.engine.begin() as conn:
            conn.execute(campaigns.campaigns_table.insert().values(
                id=self.cid, name="Test Campaign", description="", avatar="", owner_id=self.user_id
            ))
            conn.execute(campaigns.campaign_members_table.insert().values(campaign_id=self.cid, user_id=self.user_id))
            conn.execute(campaigns.user_settings_table.insert().values(user_id=self.user_id, active_campaign_id=self.cid))

        # Create a Flask app and register the blueprint so we can use the test client
        self.app = Flask(__name__)
        self.app.register_blueprint(campaigns.bp)

        # Monkeypatch require_user to simulate an authenticated user for the route
        campaigns.require_user = lambda: {"sub": self.user_id}

    def test_leave_clears_active(self):
        with self.app.test_client() as client:
            resp = client.post(f"/api/campaigns/{self.cid}/leave")
            self.assertEqual(resp.status_code, 200, resp.data)
            j = resp.get_json()
            self.assertTrue(j.get("ok"))
            self.assertEqual(j.get("campaign"), self.cid)
            self.assertEqual(j.get("member"), self.user_id)
            # The endpoint should return the current active (now cleared -> null)
            self.assertIsNone(j.get("active"))

            # Verify DB: user's active_campaign_id should be NULL
            with self.engine.connect() as conn:
                r = conn.execute(campaigns.user_settings_table.select().where(campaigns.user_settings_table.c.user_id == self.user_id)).fetchone()
                self.assertIsNotNone(r)
                # SQLAlchemy Row may be a tuple; use _mapping for a dict-like access
                self.assertIsNone(r._mapping.get('active_campaign_id'))


if __name__ == "__main__":
    unittest.main()
