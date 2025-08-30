from __future__ import annotations

import os
from flask import Flask, request
from flask_cors import CORS

# local imports (blueprints and settings)
from .config import settings
from .routes.health import bp as health_bp
from .realtime import bp as realtime_bp
from .dice import bp as dice_bp

app = Flask(__name__)

# Allow the frontend origins we use in development and production. When credentials
# are required, the response must echo the Origin (not use '*').
FRONTEND_ORIGINS = {"https://www.npcchatter.com", "http://localhost:5173"}

CORS(
  app,
  resources={r"/api/*": {"origins": list(FRONTEND_ORIGINS)}},
  supports_credentials=True,
  allow_headers=["Authorization", "Content-Type"],
)

# Register API blueprints
app.register_blueprint(health_bp)
app.register_blueprint(realtime_bp)
app.register_blueprint(dice_bp)


# Diagnostic root route to confirm the app is reachable on Render and to aid debugging.
@app.get("/")
def _root():
  return {"ok": True, "service": "npcchatter-backend"}


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
  # Provide a conservative fallback for environments where Flask-CORS or a
  # proxy may not correctly expose the Authorization header or credentials.
  origin = request.headers.get("Origin")
  if origin and origin in FRONTEND_ORIGINS:
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Credentials"] = "true"
  return response


if __name__ == "__main__":
  port = int(os.getenv("PORT", "5000"))
  app.run(host="0.0.0.0", port=port, debug=True)
