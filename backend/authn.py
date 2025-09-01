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
    try:
        key = _jwks().get_signing_key_from_jwt(token).key
    except Exception:
        # Possible causes: JWKS rotated or wrong JWKS URL. Try refreshing the JWKS
        # client once and retry. If that fails, include the token header 'kid' in
        # the 401 message to aid debugging (no token body is logged).
        try:
            # force refresh
            global _jwks_client, _cache
            _jwks_client = PyJWKClient(settings.CLERK_JWKS_URL)
            _cache["jwks_at"] = time.time()
            key = _jwks_client.get_signing_key_from_jwt(token).key
        except Exception:
            try:
                hdr = jwt.get_unverified_header(token)
                kid = hdr.get('kid')
            except Exception:
                kid = None
            abort(401, f"Invalid token (key lookup failed): Unable to find a signing key that matches: {kid}")

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
