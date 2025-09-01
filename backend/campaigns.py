from flask import Blueprint, request, jsonify, abort
from sqlalchemy import Table, Column, String, MetaData, create_engine, select
from .config import settings
from .authn import require_user

bp = Blueprint('campaigns', __name__)

metadata = MetaData()
campaigns_table = Table(
    'campaigns', metadata,
    Column('id', String, primary_key=True),
    Column('name', String, nullable=False),
)


def _engine():
    return create_engine(settings.DATABASE_URL, echo=False)


@bp.before_app_first_request
def _ensure_tables():
    try:
        engine = _engine()
        metadata.create_all(engine)
    except Exception:
        # don't crash app if DB not reachable at startup; endpoints will surface errors later
        pass


@bp.get('/api/campaigns')
def list_campaigns():
    try:
        engine = _engine()
        with engine.connect() as conn:
            res = conn.execute(select([campaigns_table.c.id, campaigns_table.c.name]))
            rows = [dict(r) for r in res.fetchall()]
        return jsonify(rows)
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.post('/api/campaigns')
def create_campaign():
    claims = require_user()
    data = request.get_json(force=True) or {}
    name = data.get('name', '').strip()
    if not name:
        abort(400, 'name required')
    cid = data.get('id') or ("c" + __import__('secrets').token_hex(6))
    try:
        engine = _engine()
        with engine.begin() as conn:
            conn.execute(campaigns_table.insert().values(id=cid, name=name))
        return jsonify({"id": cid, "name": name})
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.post('/api/campaigns/<cid>/join')
def join_campaign(cid):
    claims = require_user()
    # For now joining is a no-op (permission checks go here).
    return jsonify({"ok": True, "campaign": cid})
