import os

from flask import Flask
from core.config import CONFIG
from flask_cors import CORS
from core.blueprints import BLUEPRINTS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from core.models import db
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager


def create_app(test_config=None):
    load_dotenv()

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # App config
    app.config.from_object(CONFIG)
    # ============================================================================
    # JWT Configuration (from CONFIG)
    # ============================================================================
    # PRODUCTION NOTE: In production, JWT settings are automatically configured
    # for security (HTTPS required, CSRF protection enabled).
    # Frontend AuthContext.tsx automatically handles CSRF in production mode.
    app.config["JWT_SECRET_KEY"] = CONFIG.JWT_SECRET_KEY
    app.config["JWT_TOKEN_LOCATION"] = CONFIG.JWT_TOKEN_LOCATION
    app.config["JWT_COOKIE_SECURE"] = CONFIG.JWT_COOKIE_SECURE
    app.config["JWT_COOKIE_SAMESITE"] = CONFIG.JWT_COOKIE_SAMESITE
    app.config["JWT_COOKIE_CSRF_PROTECT"] = CONFIG.JWT_COOKIE_CSRF_PROTECT
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = CONFIG.JWT_ACCESS_TOKEN_EXPIRES
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = CONFIG.JWT_REFRESH_TOKEN_EXPIRES
    # CRITICAL: Set to False so cookies persist after browser close (for "Remember Me")
    # When True (default), cookies are session-only and deleted when browser closes
    app.config["JWT_SESSION_COOKIE"] = False

    jwt = JWTManager(app)

    # Database initialization
    db.init_app(app)
    Migrate(app, db)

    # Enable CORS (before registering blueprints)
    # Get allowed origins from CONFIG
    allowed_origins = CONFIG.CORS_ORIGINS.split(",")
    
    CORS(app, 
        origins=allowed_origins,
        supports_credentials=True,  # Required for cookies
        allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"],
        expose_headers=["X-CSRF-TOKEN", "X-CSRF-ACCESS-TOKEN", "X-CSRF-REFRESH-TOKEN"],  # Allow frontend to read CSRF headers
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register blueprints
    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)

    return app

app = create_app()