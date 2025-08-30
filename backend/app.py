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
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True, allow_headers=["Authorization", "Content-Type"])

app.register_blueprint(health_bp)
app.register_blueprint(realtime_bp)
app.register_blueprint(dice_bp)

if __name__ == "__main__":
    app.run(port=5000)


@app.after_request
def add_cors_headers(response):
    # Ensure CORS headers are present for all API responses (preflight and actual responses).
    # Use a specific origin here because Access-Control-Allow-Credentials cannot be used with '*'.
    response.headers.setdefault('Access-Control-Allow-Origin', 'https://www.npcchatter.com')
    response.headers.setdefault('Access-Control-Allow-Headers', 'Authorization,Content-Type')
    response.headers.setdefault('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.headers.setdefault('Access-Control-Allow-Credentials', 'true')
    return response
