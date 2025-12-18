from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_refresh_cookies,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
    get_csrf_token
)
from datetime import timedelta
import bcrypt
from core.models import Admins, db

bp = Blueprint("auth", __name__, url_prefix='/api/auth')


def verify_admin(email, password):
    """
    Verify admin credentials against database.
    Returns admin object if valid, None otherwise.
    """
    # Query the admin by email
    admin = Admins.query.filter_by(email=email).first()
    
    if not admin:
        return None
    
    # Check password using bcrypt
    if bcrypt.checkpw(password.encode('utf-8'), admin.password.encode('utf-8')):
        return admin
    
    return None


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({"msg": "Missing request body"}), 400
    
    email = data.get("email")
    password = data.get("password")
    remember_me = data.get("remember_me", True)  # Default to True for backwards compatibility
    
    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400
    
    # Verify admin credentials
    admin = verify_admin(email, password)
    if not admin:
        return jsonify({"msg": "Invalid email or password"}), 401

    # Create tokens with admin ID and email
    admin_id = str(admin.id)
    
    access_token = create_access_token(
        identity=admin_id,
        additional_claims={"email": admin.email, "role": "admin"}
    )
    refresh_token = create_refresh_token(identity=admin_id)
    
    resp = jsonify({
        "access_token": access_token,
        "user": {
            "id": admin.id,
            "email": admin.email
        }
    })
    
    # Set refresh token cookie
    # If remember_me is True, set persistent cookie (max_age from config)
    # If remember_me is False, set session cookie (no max_age = deleted on browser close)
    if remember_me:
        # Persistent cookie - use set_refresh_cookies which respects JWT_SESSION_COOKIE=False
        set_refresh_cookies(resp, refresh_token)
    else:
        # Session-only cookie - manually set without max_age
        cookie_key = current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token_cookie")
        cookie_path = current_app.config.get("JWT_REFRESH_COOKIE_PATH", "/")
        cookie_secure = current_app.config.get("JWT_COOKIE_SECURE", False)
        cookie_samesite = current_app.config.get("JWT_COOKIE_SAMESITE", "Lax")
        
        resp.set_cookie(
            cookie_key,
            value=refresh_token,
            httponly=True,
            secure=cookie_secure,
            samesite=cookie_samesite,
            path=cookie_path,
            # No max_age = session cookie (deleted when browser closes)
        )
        
        # Also set CSRF cookie for session-only mode (when CSRF is enabled)
        if current_app.config.get("JWT_COOKIE_CSRF_PROTECT", False):
            csrf_token = get_csrf_token(refresh_token)
            csrf_cookie_name = current_app.config.get("JWT_REFRESH_CSRF_COOKIE_NAME", "csrf_refresh_token")
            resp.set_cookie(
                csrf_cookie_name,
                value=csrf_token,
                httponly=False,  # Must be readable by JavaScript
                secure=cookie_secure,
                samesite=cookie_samesite,
                path=cookie_path,
                # No max_age = session cookie (deleted when browser closes)
            )
    
    # Also expose CSRF token in response header for frontend convenience
    # This allows frontend to read it from headers OR cookies
    if current_app.config.get("JWT_COOKIE_CSRF_PROTECT", False):
        csrf_token = get_csrf_token(refresh_token)
        resp.headers["X-CSRF-TOKEN"] = csrf_token
    
    return resp


@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)  # Only refresh token allowed
def refresh():
    identity = get_jwt_identity()
    new_access_token = create_access_token(identity=identity)
    
    resp = jsonify({"access_token": new_access_token})
    
    # Expose CSRF token in response header for frontend convenience
    if current_app.config.get("JWT_COOKIE_CSRF_PROTECT", False):
        csrf_token = get_csrf_token(new_access_token)
        resp.headers["X-CSRF-TOKEN"] = csrf_token
    
    return resp


@bp.route("/logout", methods=["POST"])
def logout():
    resp = jsonify({"msg": "Logged out"})
    unset_jwt_cookies(resp)
    return resp
