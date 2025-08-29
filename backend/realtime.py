from flask import Blueprint, jsonify, request, abort
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
