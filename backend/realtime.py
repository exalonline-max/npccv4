from flask import Blueprint, jsonify, request, abort, make_response
from ably import AblyRest
from sqlalchemy import create_engine, select
from .campaigns import campaign_members_table
from .config import settings
from .authn import require_user
import json

ALLOWED_ORIGIN = "https://www.npcchatter.com"

def _corsify(resp):
    resp.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Vary"] = "Origin"
    return resp

bp = Blueprint("realtime", __name__, url_prefix="/api/realtime")


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


@bp.get("/token")
def ably_token():
    from os import environ as _env
    ably_key = settings.ABLY_API_KEY
    if not ably_key or ":" not in ably_key:
        abort(500, "ABLY_API_KEY missing or not in appId.keyId:secret format")
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

    ably = AblyRest(ably_key)
    try:
        # ably-python's type stubs don't define these keyword args Pylance
        # expects, so silence type checking here. Runtime will accept them.
        token_request = ably.auth.create_token_request(  # type: ignore[arg-type]
            client_id=user_id,
            capability=(json.dumps(capability) if capability else None),
            ttl=60 * 60 * 1000,
        )
        try:
            # Helpful during diagnostics; remove or reduce in production logs.
            print("TokenRequest.keyName:", token_request.get("keyName"))
        except Exception:
            pass
    except Exception as e:
        import sys, traceback
        traceback.print_exc(file=sys.stdout)
        resp = jsonify({"error": "failed to create Ably token request"})
        resp.status_code = 500
        return _corsify(resp)

    resp = jsonify(token_request)
    return _corsify(resp)


@bp.route("/token", methods=["OPTIONS"])
def ably_token_options():
    # Explicit preflight response to satisfy browsers when Authorization header
    # and credentials are used. This is a conservative, explicit CORS reply.
    resp = make_response(("", 204))
    resp.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    resp.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Vary"] = "Origin"
    return resp
