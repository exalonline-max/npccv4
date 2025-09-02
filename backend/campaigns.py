@bp.patch('/api/campaigns/<cid>')
def update_campaign(cid):
    claims = require_user()
    data = request.get_json(force=True) or {}
    name = data.get('name')
    description = data.get('description')
    avatar = data.get('avatar')
    try:
        engine = _engine()
        with engine.begin() as conn:
            update_values = {}
            if name is not None:
                update_values['name'] = name
            if description is not None:
                update_values['description'] = description
            if avatar is not None:
                update_values['avatar'] = avatar
            if not update_values:
                abort(400, 'No fields to update')
            conn.execute(
                campaigns_table.update().where(campaigns_table.c.id == cid).values(**update_values)
            )
            res = conn.execute(select(
                campaigns_table.c.id,
                campaigns_table.c.name,
                campaigns_table.c.description,
                campaigns_table.c.avatar
            ).where(campaigns_table.c.id == cid))
            row = res.fetchone()
            if not row:
                abort(404, 'Campaign not found')
            return jsonify(dict(row._mapping))
    except Exception as e:
        abort(500, f"DB error: {e}")
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
    Column('description', String, nullable=True),
    Column('avatar', String, nullable=True),
)

campaign_members_table = Table(
    'campaign_members', metadata,
    Column('campaign_id', String, nullable=False),
    Column('user_id', String, nullable=False),
)


def _engine():
    return create_engine(settings.DATABASE_URL, echo=False)


@bp.before_app_request
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
            res = conn.execute(select(
                campaigns_table.c.id,
                campaigns_table.c.name,
                campaigns_table.c.description,
                campaigns_table.c.avatar
            ))
            rows = [dict(r._mapping) for r in res.fetchall()]
        return jsonify(rows)
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.post('/api/campaigns')
def create_campaign():
    claims = require_user()
    data = request.get_json(force=True) or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    avatar = data.get('avatar', '').strip()
    if not name:
        abort(400, 'name required')
    cid = data.get('id') or ("c" + __import__('secrets').token_hex(6))
    try:
        engine = _engine()
        with engine.begin() as conn:
            conn.execute(campaigns_table.insert().values(
                id=cid,
                name=name,
                description=description,
                avatar=avatar
            ))
        return jsonify({"id": cid, "name": name, "description": description, "avatar": avatar})
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.post('/api/campaigns/<cid>/join')
def join_campaign(cid):
    claims = require_user()
    # Persist membership in campaign_members table
    user_id = claims.get('sub') or claims.get('id') or claims.get('user_id')
    if not user_id:
        abort(400, 'unable to determine user id')
    try:
        engine = _engine()
        with engine.begin() as conn:
            # ensure campaign exists
            res = conn.execute(select(campaigns_table.c.id).where(campaigns_table.c.id == cid)).fetchone()
            if not res:
                abort(404, 'campaign not found')
            # insert membership if not exists (portable): check and insert
            existing = conn.execute(
                select(campaign_members_table.c.user_id).where(
                    (campaign_members_table.c.campaign_id == cid) & (campaign_members_table.c.user_id == user_id)
                )
            ).fetchone()
            if not existing:
                conn.execute(campaign_members_table.insert().values(campaign_id=cid, user_id=user_id))
        return jsonify({"ok": True, "campaign": cid, "member": user_id})
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.get('/api/campaigns/<cid>/members')
def list_members(cid):
    try:
        engine = _engine()
        with engine.connect() as conn:
            res = conn.execute(select(campaign_members_table.c.user_id).where(campaign_members_table.c.campaign_id == cid))
            rows = [r[0] for r in res.fetchall()]
        return jsonify(rows)
    except Exception as e:
        abort(500, f"DB error: {e}")
