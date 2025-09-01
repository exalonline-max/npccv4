from __future__ import annotations

import os
from flask import Flask, request
from flask_cors import CORS

# local imports (blueprints and settings)
from .config import settings
from .routes.health import bp as health_bp
from .realtime import bp as realtime_bp
from .dice import bp as dice_bp
from .campaigns import bp as campaigns_bp

app = Flask(__name__)

# Allow the frontend origins we use in development and production. When credentials
# are required, the response must echo the Origin (not use '*').
FRONTEND_ORIGINS = {
  "https://www.npcchatter.com",   # prod (www)
  "https://npcchatter.com",       # prod (apex) — add if you ever serve from apex
  "http://localhost:5173",        # Vite dev
  "http://127.0.0.1:5173",        # Vite dev (loopback)
}

CORS(
  app,
  resources={r"/api/*": {"origins": list(FRONTEND_ORIGINS)}},
  supports_credentials=True,
  methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allow_headers=[
    "Authorization",
    "Content-Type",
    "X-Requested-With",
    "Ably-Agent",
    "Ably-Version",
  ],
  expose_headers=[
    "Content-Length",
    "Content-Type",
  ],
  max_age=600,
)

# Register API blueprints
app.register_blueprint(health_bp)
app.register_blueprint(realtime_bp)
app.register_blueprint(dice_bp)
app.register_blueprint(campaigns_bp)

@app.route("/api/<path:subpath>", methods=["OPTIONS"])
def _preflight_catchall(subpath):
  return ("", 204)


# Diagnostic root route to confirm the app is reachable on Render and to aid debugging.
@app.get("/")
def _root():
  return {"ok": True, "service": "npcchatter-backend"}


# Lightweight diagnostics endpoint that reports presence of important env vars
# without leaking secrets. Safe to call from the browser (no secret values).
@app.get("/api/_diag")
def _diag():
  try:
    has_ably = bool(settings.ABLY_API_KEY)
    masked_ably = None
    if has_ably:
      val = settings.ABLY_API_KEY
      if len(val) >= 8:
        masked_ably = f"{val[:4]}...{val[-4:]}"
      else:
        masked_ably = "***"

    # Attempt a lightweight DB check (count campaigns) without exposing the
    # DATABASE_URL or other secrets. This helps troubleshoot which DB the
    # running process can reach.
    db_count = None
    try:
      from sqlalchemy import create_engine, text
      if settings.DATABASE_URL:
        eng = create_engine(settings.DATABASE_URL, echo=False)
        with eng.connect() as conn:
          r = conn.execute(text('SELECT COUNT(*) FROM campaigns'))
          db_count = int(r.scalar() or 0)
    except Exception:
      db_count = None

    return {
      "ok": True,
      "has_ably_key": has_ably,
      "ably_key_masked": masked_ably,
      "clerk_jwks_configured": bool(settings.CLERK_JWKS_URL),
      "db_campaigns": db_count,
    }
  except Exception:
    return {"ok": False}


@app.get("/api/_jwks")
def _jwks_diag():
  """Return the list of key ids (kids) present in configured JWKS URLs.
  This helps debug 'Unable to find a signing key that matches' errors by
  showing which kids the running backend currently trusts.
  """
  import requests
  out = {"ok": True, "jwks": []}
  try:
    urls = [u for u in [settings.CLERK_JWKS_URL, settings.CLERK_JWKS_URL_ALT] if u]
    for u in urls:
      try:
        r = requests.get(u, timeout=5)
        r.raise_for_status()
        data = r.json()
        keys = [k.get('kid') for k in data.get('keys', [])]
        out['jwks'].append({"url": u, "kids": keys})
      except Exception as e:
        out['jwks'].append({"url": u, "error": str(e)})
  except Exception as e:
    return {"ok": False, "error": str(e)}
  return out


# Print registered routes at import time so Gunicorn logs show what endpoints exist.
def _log_routes():
  try:
    import sys
    sys.stdout.write("Registered routes:\n")
    for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
      sys.stdout.write(f"  {rule.methods} {rule.rule}\n")
    sys.stdout.flush()
  except Exception:
    pass


_log_routes()


@app.after_request
def add_cors_headers(response):
  """Fallback CORS headers in case a proxy strips them.
  If Flask-CORS already set headers, we leave them alone.
  """
  if "Access-Control-Allow-Origin" in response.headers:
    return response  # Flask-CORS already handled

  origin = request.headers.get("Origin")
  if origin and origin in FRONTEND_ORIGINS and request.path.startswith("/api/"):
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = ",".join([
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "Ably-Agent",
      "Ably-Version",
    ])
    response.headers["Access-Control-Max-Age"] = "600"
  return response


if __name__ == "__main__":
  port = int(os.getenv("PORT", "5000"))
  app.run(host="0.0.0.0", port=port, debug=True)
