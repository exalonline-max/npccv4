# Leading duplicated route removed; blueprint/imports defined below
from flask import Blueprint, request, jsonify, abort
from sqlalchemy import (
    Table, Column, String, MetaData, create_engine, select, PrimaryKeyConstraint
)
from .config import settings
from .authn import require_user

bp = Blueprint("campaigns", __name__)

# --- DB Metadata & Tables ---
metadata = MetaData()

campaigns_table = Table(
    "campaigns",
    metadata,
    Column("id", String, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=True),
    Column("avatar", String, nullable=True),
)

campaign_members_table = Table(
    "campaign_members",
    metadata,
    Column("campaign_id", String, nullable=False),
    Column("user_id", String, nullable=False),
    PrimaryKeyConstraint("campaign_id", "user_id", name="pk_campaign_members"),
)

# --- Engine helper ---
def _engine():
    # pool_pre_ping helps with stale connections on hosts like Render
    return create_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True, future=True)

# --- Ensure tables exist ---
@bp.before_app_request
def _ensure_tables():
    try:
        engine = _engine()
        metadata.create_all(engine)
    except Exception:
        # Don't crash app if DB not reachable at startup; endpoints will surface errors later
        pass

# --- Routes ---

@bp.patch("/api/campaigns/<cid>")
def update_campaign(cid: str):
    # Ensure the caller is authenticated (and potentially use claims later)
    require_user()

    data = request.get_json(force=True) or {}
    update_values = {}

    # Only set provided fields; allow clearing description/avatar by sending null
    if "name" in data:
        if data["name"] is None or not str(data["name"]).strip():
            abort(400, "Field 'name' cannot be empty.")
        update_values["name"] = data["name"]
    if "description" in data:
        update_values["description"] = data["description"]
    if "avatar" in data:
        update_values["avatar"] = data["avatar"]

    if not update_values:
        abort(400, "No fields to update.")

    try:
        engine = _engine()
        with engine.begin() as conn:
            # Update
            result = conn.execute(
                campaigns_table.update()
                .where(campaigns_table.c.id == cid)
                .values(**update_values)
            )
            # If nothing was updated, the campaign likely doesn't exist
            if result.rowcount == 0:
                abort(404, "Campaign not found")

            # Return the fresh row
            res = conn.execute(
                select(
                    campaigns_table.c.id,
                    campaigns_table.c.name,
                    campaigns_table.c.description,
                    campaigns_table.c.avatar,
                ).where(campaigns_table.c.id == cid)
            )
            row = res.fetchone()
            if not row:
                abort(404, "Campaign not found")
            return jsonify(dict(row._mapping))
    except Exception as e:
        abort(500, f"DB error: {e}")

@bp.get("/api/campaigns/<cid>/members")
def list_members(cid: str):
    try:
        engine = _engine()
        with engine.connect() as conn:
            res = conn.execute(
                select(campaign_members_table.c.user_id)
                .where(campaign_members_table.c.campaign_id == cid)
            )
            rows = [r[0] for r in res.fetchall()]
        return jsonify(rows)
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.get('/api/campaigns')
def list_campaigns():
    try:
        engine = _engine()
        with engine.connect() as conn:
            res = conn.execute(select(
                campaigns_table.c.id,
                campaigns_table.c.name,
                campaigns_table.c.description,
                campaigns_table.c.avatar,
            ))
            rows = [dict(r._mapping) for r in res.fetchall()]
        return jsonify(rows)
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.post('/api/campaigns')
def create_campaign():
    claims = require_user()
    data = request.get_json(force=True) or {}
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip()
    avatar = (data.get('avatar') or '').strip()
    if not name:
        abort(400, 'name required')
    cid = data.get('id') or ("c" + __import__('secrets').token_hex(6))
    owner_id = claims.get('sub') or claims.get('id') or claims.get('user_id')
    try:
        engine = _engine()
        with engine.begin() as conn:
            conn.execute(campaigns_table.insert().values(
                id=cid,
                name=name,
                description=description,
                avatar=avatar,
            ))
        return jsonify({"id": cid, "name": name, "description": description, "avatar": avatar})
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.post('/api/campaigns/<cid>/join')
def join_campaign(cid: str):
    claims = require_user()
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
            # insert membership if not exists
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