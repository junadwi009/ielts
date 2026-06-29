from flask import Flask
from flask_cors import CORS
from .config import Config
from .errors import register_error_handlers

def create_app(overrides=None):
    app = Flask(__name__)
    cfg = Config(overrides)
    app.config["APP_CONFIG"] = cfg
    CORS(app, origins=[cfg.CORS_ORIGIN])
    register_error_handlers(app)
    from .routes.health import bp as health_bp
    app.register_blueprint(health_bp)
    return app
