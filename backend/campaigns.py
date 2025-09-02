# Leading duplicated route removed; blueprint/imports defined below
from flask import Blueprint, request, jsonify, abort
from sqlalchemy import (
    Table, Column, String, MetaData, create_engine, select, PrimaryKeyConstraint, DateTime, text
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
    # Owner ID (Clerk user id). Nullable for existing rows; new creates will set this.
    Column("owner_id", String, nullable=True),
    Column("created_at", DateTime, server_default=text('CURRENT_TIMESTAMP')),
    Column("updated_at", DateTime, nullable=True),
)

campaign_members_table = Table(
    "campaign_members",
    metadata,
    Column("campaign_id", String, nullable=False),
    Column("user_id", String, nullable=False),
    PrimaryKeyConstraint("campaign_id", "user_id", name="pk_campaign_members"),
)

# Simple user settings table to persist small per-user preferences such as
# the currently active campaign. Kept in this module so the existing
# `metadata.create_all()` call will create the table automatically.
user_settings_table = Table(
    "user_settings",
    metadata,
    Column("user_id", String, primary_key=True),
    Column("active_campaign_id", String, nullable=True),
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
        # Ensure an index on campaign_members.user_id for faster membership queries
        try:
            with engine.begin() as conn:
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_campaign_members_user_id ON campaign_members (user_id)'))
        except Exception:
            # Non-fatal: some DBs may not support IF NOT EXISTS for index creation
            pass
    except Exception:
        # Don't crash app if DB not reachable at startup; endpoints will surface errors later
        pass

# --- Routes ---

@bp.patch("/api/campaigns/<cid>")
def update_campaign(cid: str):
    # Only authenticated owners may modify campaign metadata
    claims = require_user()
    user_id = claims.get('sub') or claims.get('id') or claims.get('user_id')

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
            # Ensure requester is owner
            owner_row = conn.execute(select(campaigns_table.c.owner_id).where(campaigns_table.c.id == cid)).fetchone()
            if not owner_row:
                abort(404, "Campaign not found")
            if owner_row[0] != user_id:
                abort(403, "Only the campaign owner may edit campaign metadata")

            # Update
            result = conn.execute(
                campaigns_table.update()
                .where(campaigns_table.c.id == cid)
                .values(**{**update_values, 'updated_at': text('CURRENT_TIMESTAMP')})
            )
            # If nothing was updated, something unexpected happened
            if result.rowcount == 0:
                abort(404, "Campaign not found")

            # Return the fresh row
            res = conn.execute(
                select(
                    campaigns_table.c.id,
                    campaigns_table.c.name,
                    campaigns_table.c.description,
                    campaigns_table.c.avatar,
                    campaigns_table.c.owner_id,
                    campaigns_table.c.created_at,
                    campaigns_table.c.updated_at,
                ).where(campaigns_table.c.id == cid)
            )
            row = res.fetchone()
            if not row:
                abort(404, "Campaign not found")
            return jsonify(dict(row._mapping))
    except Exception as e:
        import traceback
        traceback.print_exc()
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
                owner_id=owner_id,
                created_at=text('CURRENT_TIMESTAMP'),
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


@bp.post('/api/campaigns/<cid>/leave')
def leave_campaign(cid: str):
    claims = require_user()
    user_id = claims.get('sub') or claims.get('id') or claims.get('user_id')
    if not user_id:
        abort(400, 'unable to determine user id')
    try:
        engine = _engine()
        with engine.begin() as conn:
            # delete membership if exists
            conn.execute(
                campaign_members_table.delete().where(
                    (campaign_members_table.c.campaign_id == cid) & (campaign_members_table.c.user_id == user_id)
                )
            )
        return jsonify({"ok": True, "campaign": cid, "member": user_id})
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.get('/api/user/active_campaign')
def get_active_campaign():
    claims = require_user()
    user_id = claims.get('sub') or claims.get('id') or claims.get('user_id')
    try:
        engine = _engine()
        with engine.connect() as conn:
            res = conn.execute(select(user_settings_table.c.active_campaign_id).where(user_settings_table.c.user_id == user_id)).fetchone()
            if not res:
                return jsonify({"active": None})
            return jsonify({"active": res[0]})
    except Exception as e:
        abort(500, f"DB error: {e}")


@bp.post('/api/user/active_campaign')
def set_active_campaign():
    claims = require_user()
    user_id = claims.get('sub') or claims.get('id') or claims.get('user_id')
    data = request.get_json(force=True) or {}
    active = data.get('active')
    # allow clearing by sending null
    try:
        engine = _engine()
        with engine.begin() as conn:
            # Validate that active is either None or a campaign the user has joined or owns
            if active is not None:
                # ensure campaign exists
                c = conn.execute(select(campaigns_table.c.id, campaigns_table.c.owner_id).where(campaigns_table.c.id == active)).fetchone()
                if not c:
                    abort(404, 'campaign not found')
                # check membership or ownership
                member = conn.execute(select(campaign_members_table.c.user_id).where(
                    (campaign_members_table.c.campaign_id == active) & (campaign_members_table.c.user_id == user_id)
                )).fetchone()
                if not member and c[1] != user_id:
                    abort(403, 'user is not a member or owner of that campaign')

            # upsert-style insert/update
            result = conn.execute(
                user_settings_table.update().where(user_settings_table.c.user_id == user_id).values(active_campaign_id=active)
            )
            if result.rowcount == 0:
                conn.execute(user_settings_table.insert().values(user_id=user_id, active_campaign_id=active))
        return jsonify({"ok": True, "active": active})
    except Exception as e:
        abort(500, f"DB error: {e}")