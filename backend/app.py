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
    # JWT Configuration
    # ============================================================================
    # TODO: Move to config / environment variables
    app.config["JWT_SECRET_KEY"] = "super-secret-change-me" # TODO: Change in production (to .env)
    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    
    # PRODUCTION: For production deployment, change these settings:
    # 1. Set JWT_COOKIE_SECURE = True (requires HTTPS)
    # 2. Set JWT_COOKIE_CSRF_PROTECT = True (enables CSRF protection)
    # 3. Update frontend AuthContext.tsx to use the production CSRF code blocks
    # 4. Consider using "Strict" for JWT_COOKIE_SAMESITE if same domain
    app.config["JWT_COOKIE_SECURE"] = False  # DEVELOPMENT ONLY - True in production with HTTPS
    app.config["JWT_COOKIE_SAMESITE"] = "Lax"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # DEVELOPMENT ONLY - True in production
    
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900  # 15 minutes (in seconds)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400 * 7  # 7 days

    jwt = JWTManager(app)

    # Database initialization
    db.init_app(app)
    Migrate(app, db)

    # Enable CORS (before registering blueprints)
    # Get allowed origins from environment variable or use defaults for development
    allowed_origins = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:3001"
    ).split(",")
    
    CORS(app, 
        origins=allowed_origins,
        supports_credentials=True,  # Required for cookies
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register blueprints
    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)

    return app

app = create_app()