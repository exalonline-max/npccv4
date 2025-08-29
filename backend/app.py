from flask import Flask
from flask_cors import CORS
from .config import settings
from .routes.health import bp as health_bp
from .realtime import bp as realtime_bp
from .dice import bp as dice_bp

app = Flask(__name__)
app.config["SECRET_KEY"] = settings.APP_SECRET
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(health_bp)
app.register_blueprint(realtime_bp)
app.register_blueprint(dice_bp)

if __name__ == "__main__":
    app.run(port=5000)
