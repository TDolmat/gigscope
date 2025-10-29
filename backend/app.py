import os

from flask import Flask
from core.config import CONFIG
from flask_cors import CORS
from core.blueprints import BLUEPRINTS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from core.models import db
from dotenv import load_dotenv


def create_app(test_config=None):
    load_dotenv()

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # App config
    app.config.from_object(CONFIG)

    # Database initialization
    db.init_app(app)
    Migrate(app, db)

    # Register blueprints
    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)

    # Enable CORS
    CORS(app)

    return app

app = create_app()