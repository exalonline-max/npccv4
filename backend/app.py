from flask import Flask
from flask_cors import CORS
from .config import settings
from .routes.health import bp as health_bp
from .realtime import bp as realtime_bp
from .dice import bp as dice_bp

app = Flask(__name__)
app.config["SECRET_KEY"] = settings.APP_SECRET
# Enable CORS for API routes and allow the Authorization header (used by Clerk JWT)
# supports_credentials=True so that browsers may send credentials if needed.
allowed_origins = [
    "https://www.npcchatter.com",
    "https://npcchatter.com",
    "http://localhost:5173",
]
CORS(
    app,
    resources={r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"],
        "max_age": 86400,
    }},
    supports_credentials=False,  # no cookies; using Authorization: Bearer
)

app.register_blueprint(health_bp)
app.register_blueprint(realtime_bp)
app.register_blueprint(dice_bp)

# Preflight handler for any /api/* route to ensure OPTIONS returns 204
@app.route('/api/<path:subpath>', methods=['OPTIONS'])
def cors_preflight(subpath):
    return ("", 204)

if __name__ == "__main__":
    app.run(port=5000)


@app.after_request
def add_cors_headers(response):
    response.headers.add('Vary', 'Origin')
    return response
