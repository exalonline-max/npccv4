import random
from dataclasses import dataclass
from flask import Blueprint, request, jsonify, abort
from ably import AblyRest
from .config import settings
from .authn import require_user

bp = Blueprint("dice", __name__)

@dataclass
class Roll:
    total: int
    detail: str

def roll(expr: str) -> Roll:
    expr = expr.lower().replace(" ", "")
    if "+" in expr:
        dice, mod = expr.split("+", 1)
        mod = int(mod)
    elif "-" in expr:
        dice, mod = expr.split("-", 1)
        mod = -int(mod)
    else:
        dice, mod = expr, 0
    n, die = dice.split("d")
    n = int(n or 1)
    sides = int(die)
    rolls = [random.randint(1, sides) for _ in range(n)]
    total = sum(rolls) + mod
    detail = f"{'+'.join(map(str, rolls))}{'+' if mod>=0 and mod!=0 else ''}{mod if mod else ''}"
    return Roll(total, detail)

@bp.post("/api/campaigns/<cid>/roll")
def do_roll(cid):
    claims = require_user()
    data = request.get_json(force=True) if request.data else {}
    expr = data.get("expr", "1d20")
    r = roll(expr)
    ably = AblyRest(settings.ABLY_API_KEY)
    channel = ably.channels.get(f"campaign:{cid}")
    channel.publish("dice", {
        "user": claims.get("sub"),
        "expr": expr,
        "result": f"{r.total} ({r.detail})"
    })
    return jsonify({"ok": True, "total": r.total, "detail": r.detail})
