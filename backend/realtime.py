from flask import Blueprint, jsonify, request, abort, make_response
from ably import AblyRest
from .config import settings
from .authn import require_user

bp = Blueprint("realtime", __name__)

def user_can_access_channel(user_id: str, channel: str) -> bool:
    # TODO: check DB membership. For now, allow campaign:* channels.
    return channel.startswith("campaign:")

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
            abort(403, "Not allowed for this channel")
        capability = {chan: ["publish", "subscribe", "presence", "history"]}

    ably = AblyRest(settings.ABLY_API_KEY)
    token_request = ably.auth.create_token_request(
        client_id=user_id,
        capability=capability or None,
        ttl=60 * 60 * 1000,
    )
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
