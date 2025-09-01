from flask import Blueprint, jsonify, request, abort, make_response
from ably import AblyRest
from sqlalchemy import create_engine, select
from .campaigns import campaign_members_table
from .config import settings
from .authn import require_user

bp = Blueprint("realtime", __name__)


def _engine():
    return create_engine(settings.DATABASE_URL, echo=False)


def user_can_access_channel(user_id: str, channel: str) -> bool:
    # Only campaign:* channels are supported. For campaign channels, verify
    # the user is a member by consulting the campaign_members table.
    if not channel.startswith("campaign:"):
        return False
    cid = channel.split(':', 1)[1]
    try:
        engine = _engine()
        with engine.connect() as conn:
            res = conn.execute(
                select(campaign_members_table.c.user_id).where(
                    (campaign_members_table.c.campaign_id == cid) & (campaign_members_table.c.user_id == user_id)
                )
            )
            # If the select succeeded and returned a row, the user is a member.
            row = res.fetchone()
            return bool(row)
    except Exception:
        # On DB error, default to deny to be safe.
        return False


@bp.get("/api/realtime/token")
def ably_token():
    claims = require_user()
    user_id = claims.get("sub") or claims.get("user_id")
    if not user_id:
        abort(401, "No user id in token")

    chan = request.args.get("channel", "")
    capability = {}
    if chan:
        if not user_can_access_channel(user_id, chan):
            abort(403, "Not a member of that campaign")
        capability = {chan: ["publish", "subscribe", "presence", "history"]}

    ably = AblyRest(settings.ABLY_API_KEY)
    try:
        token_request = ably.auth.create_token_request(
            client_id=user_id,
            capability=capability or None,
            ttl=60 * 60 * 1000,
        )
    except Exception as e:
        import sys, traceback
        traceback.print_exc(file=sys.stdout)
        return jsonify({"error": "failed to create Ably token request"}), 500

    return jsonify(token_request)


@bp.route("/api/realtime/token", methods=["OPTIONS"])
def ably_token_options():
    # Explicit preflight response to satisfy browsers when Authorization header
    # and credentials are used. This is a conservative, explicit CORS reply.
    resp = make_response(("", 204))
    resp.headers["Access-Control-Allow-Origin"] = "https://www.npcchatter.com"
    resp.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Vary"] = "Origin"
    return resp
