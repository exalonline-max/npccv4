import time
from flask import request, abort
import jwt
from jwt import PyJWKClient
from .config import settings

_jwks_client = None
_cache = {"jwks_at": 0}

def _jwks():
    global _jwks_client
    now = time.time()
    if _jwks_client is None or now - _cache["jwks_at"] > 3600:
        _jwks_client = PyJWKClient(settings.CLERK_JWKS_URL)
        _cache["jwks_at"] = now
    return _jwks_client

def require_user():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        abort(401, "Missing bearer token")
    token = auth.split(" ", 1)[1]
    key = _jwks().get_signing_key_from_jwt(token).key
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"leeway": 10},
        )
    except Exception as e:
        abort(401, f"Invalid token: {e}")
    if settings.CLERK_ISSUER and claims.get("iss") != settings.CLERK_ISSUER:
        abort(401, "Wrong issuer")
    return claims
