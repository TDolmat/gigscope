import os
from typing import NamedTuple


class Config(NamedTuple):
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    SQLALCHEMY_DATABASE_URI: str
    SQLALCHEMY_TRACK_MODIFICATIONS: bool


def _get_config(environment: str) -> Config:
    if environment == 'development':
        return Config(
            # Add development config here
            SECRET_KEY='dev-secret-key',
            ENCRYPTION_KEY='dev-encryption-key-32-chars!!',  # 32 characters for development
            SQLALCHEMY_DATABASE_URI='postgresql://postgres:postgres@localhost:5432/gigscope_development',
            SQLALCHEMY_TRACK_MODIFICATIONS=False
        )
    elif environment == 'testing':
        return Config(
            # Add testing config here
            SECRET_KEY='test-secret-key',
            ENCRYPTION_KEY='test-encryption-key-32-chars!',  # 32 characters for testing
            SQLALCHEMY_DATABASE_URI='postgresql://postgres:postgres@localhost:5432/gigscope_testing',
            SQLALCHEMY_TRACK_MODIFICATIONS=False
        )
    elif environment == 'production':
        return Config(
            # Add production config here
            SECRET_KEY=os.getenv('SECRET_KEY'),
            ENCRYPTION_KEY=os.getenv('ENCRYPTION_KEY'),
            SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL'),
            SQLALCHEMY_TRACK_MODIFICATIONS=False
        )

env = os.getenv('FLASK_ENV') or 'development'
CONFIG = _get_config(env)
