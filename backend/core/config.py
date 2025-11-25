import os
from typing import NamedTuple


class Config(NamedTuple):
    # Database
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    SQLALCHEMY_DATABASE_URI: str
    SQLALCHEMY_TRACK_MODIFICATIONS: bool

    # URLs
    BASE_URL: str
    CIRCLE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_TOKEN_LOCATION: list
    JWT_COOKIE_SECURE: bool
    JWT_COOKIE_SAMESITE: str
    JWT_COOKIE_CSRF_PROTECT: bool
    JWT_ACCESS_TOKEN_EXPIRES: int  # seconds
    JWT_REFRESH_TOKEN_EXPIRES: int  # seconds
    
    # CORS
    CORS_ORIGINS: str  # comma-separated string

    # Defaults
    DEFAULT_MAX_MAIL_OFFERS: int


def _get_config(environment: str) -> Config:
    if environment == 'development':
        return Config(
            # Database
            SECRET_KEY='dev-secret-key',
            ENCRYPTION_KEY='dev-encryption-key-32-chars!!',  # 32 characters for development
            SQLALCHEMY_DATABASE_URI='postgresql://postgres:postgres@localhost:5432/gigscope_development',
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            BASE_URL='http://localhost:3000',
            CIRCLE_URL='https://circle.so/c/be-free-club',
            # JWT - Development settings (less secure for easier development)
            JWT_SECRET_KEY='dev-jwt-secret-key-change-in-production',
            JWT_TOKEN_LOCATION=['headers', 'cookies'],
            JWT_COOKIE_SECURE=False,  # Allow HTTP in development
            JWT_COOKIE_SAMESITE='Lax',
            JWT_COOKIE_CSRF_PROTECT=False,  # Disabled for development
            JWT_ACCESS_TOKEN_EXPIRES=900,  # 15 minutes
            JWT_REFRESH_TOKEN_EXPIRES=604800,  # 7 days
            
            # CORS
            CORS_ORIGINS='http://localhost:3000,http://localhost:3001',
            DEFAULT_MAX_MAIL_OFFERS=10
        )
    elif environment == 'testing':
        return Config(
            # Database
            SECRET_KEY='test-secret-key',
            ENCRYPTION_KEY='test-encryption-key-32-chars!',  # 32 characters for testing
            SQLALCHEMY_DATABASE_URI='postgresql://postgres:postgres@localhost:5432/gigscope_testing',
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            BASE_URL='http://localhost:3000',
            CIRCLE_URL='https://circle.so/c/be-free-club',
            # JWT - Testing settings
            JWT_SECRET_KEY='test-jwt-secret-key',
            JWT_TOKEN_LOCATION=['headers', 'cookies'],
            JWT_COOKIE_SECURE=False,
            JWT_COOKIE_SAMESITE='Lax',
            JWT_COOKIE_CSRF_PROTECT=False,
            JWT_ACCESS_TOKEN_EXPIRES=900,  # 15 minutes
            JWT_REFRESH_TOKEN_EXPIRES=604800,  # 7 days
            
            # CORS
            CORS_ORIGINS='http://localhost:3000,http://localhost:3001',
            DEFAULT_MAX_MAIL_OFFERS=10
        )
    elif environment == 'production':
        return Config(
            # Database
            SECRET_KEY=os.getenv('SECRET_KEY'),
            ENCRYPTION_KEY=os.getenv('ENCRYPTION_KEY'),
            SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL'),
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            BASE_URL=os.getenv('BASE_URL'),
            CIRCLE_URL=os.getenv('CIRCLE_URL'),
            # JWT - Production settings (secure)
            JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY'),
            JWT_TOKEN_LOCATION=['headers', 'cookies'],
            JWT_COOKIE_SECURE=True,  # Require HTTPS
            JWT_COOKIE_SAMESITE='Lax',
            JWT_COOKIE_CSRF_PROTECT=True,  # Enable CSRF protection
            JWT_ACCESS_TOKEN_EXPIRES=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '900')),  # Default 15 minutes
            JWT_REFRESH_TOKEN_EXPIRES=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', '604800')),  # Default 7 days
            
            # CORS
            CORS_ORIGINS=os.getenv('CORS_ORIGINS', 'http://localhost:3000'),
            DEFAULT_MAX_MAIL_OFFERS=int(os.getenv('DEFAULT_MAX_MAIL_OFFERS', '10'))
        )

env = os.getenv('FLASK_ENV') or 'development'
CONFIG = _get_config(env)
