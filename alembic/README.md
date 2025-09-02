Alembic migrations for npccv4

Usage (recommended):

1. Ensure `backend/requirements.txt` is installed into your environment (or at least `alembic` and `sqlalchemy`).

2. Run the provided helper which reads `backend.config.settings.DATABASE_URL`:

   python backend/alembic_upgrade.py head

3. To autogenerate a new migration after model changes:

   alembic revision --autogenerate -m "describe change"

Notes:
- The alembic env reads `backend.campaigns.metadata` as the target for autogeneration.
- For CI or production, run the helper script as part of your deploy to apply migrations.
