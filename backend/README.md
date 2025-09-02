Local development
-----------------

Install dev requirements (avoids building psycopg2 locally):

```
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
```

If you need `psycopg2-binary` for production, install it separately or let your deploy environment install `backend/requirements.txt`.

Migrations
----------

Run migrations locally (the helper reads `backend.config.settings.DATABASE_URL`):

```
DATABASE_URL=sqlite:///tmp_migration.db python backend/alembic_upgrade.py head
```

On Render the build step runs the migration helper automatically (see `render.yaml`). The helper will be skipped if DATABASE_URL is not set or migration fails.
