from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_refresh_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity
)
import bcrypt
from core.models import Admins, db

bp = Blueprint("auth", __name__, url_prefix='/auth')


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
    
    # Store refresh token in httpOnly cookie
    set_refresh_cookies(resp, refresh_token)
    return resp


@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)  # Only refresh token allowed
def refresh():
    identity = get_jwt_identity()
    new_access_token = create_access_token(identity=identity)
    return jsonify({"access_token": new_access_token})


@bp.route("/logout", methods=["POST"])
def logout():
    resp = jsonify({"msg": "Logged out"})
    unset_jwt_cookies(resp)
    return resp
