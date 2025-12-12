from flask import request, jsonify
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from core.models import db, User, UserEmailPreference
from sqlalchemy import and_
from datetime import datetime
from . import bp


@bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users with their preferences."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('search', '', type=str).strip()
    
    # Limit per_page to prevent abuse
    per_page = min(per_page, 100)
    
    # Base query
    query = User.query.order_by(User.created_at.desc())
    
    # Apply search filter if provided
    if search:
        query = query.filter(User.email.ilike(f'%{search}%'))
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    users = []
    for user in pagination.items:
        # Get active preference
        preference = UserEmailPreference.query.filter(
            and_(
                UserEmailPreference.user_id == user.id,
                UserEmailPreference.deleted_at.is_(None)
            )
        ).first()
        
        users.append({
            'id': user.id,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None,
            'is_subscribed': preference is not None,
            'preferences': {
                'must_contain': preference.must_include_keywords if preference else [],
                'may_contain': preference.can_include_keywords if preference else [],
                'must_not_contain': preference.cannot_include_keywords if preference else [],
            } if preference else None,
        })
    
    return jsonify({
        'users': users,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }), HTTPStatus.OK


@bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user with their preferences."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), HTTPStatus.NOT_FOUND
    
    # Get active preference
    preference = UserEmailPreference.query.filter(
        and_(
            UserEmailPreference.user_id == user.id,
            UserEmailPreference.deleted_at.is_(None)
        )
    ).first()
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'updated_at': user.updated_at.isoformat() if user.updated_at else None,
        'is_subscribed': preference is not None,
        'preferences': {
            'must_contain': preference.must_include_keywords if preference else [],
            'may_contain': preference.can_include_keywords if preference else [],
            'must_not_contain': preference.cannot_include_keywords if preference else [],
        } if preference else None,
        'email_preferences_token': user.email_preferences_token,
        'email_unsubscribe_token': user.email_unsubscribe_token,
    }), HTTPStatus.OK


@bp.route('/users/<int:user_id>/preferences', methods=['PUT'])
@jwt_required()
def update_user_preferences(user_id):
    """Update user's keyword preferences."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), HTTPStatus.NOT_FOUND
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    must_contain = data.get('must_contain', [])
    may_contain = data.get('may_contain', [])
    must_not_contain = data.get('must_not_contain', [])
    
    # Ensure arrays
    if isinstance(must_contain, str):
        must_contain = [kw.strip() for kw in must_contain.split(',') if kw.strip()]
    if isinstance(may_contain, str):
        may_contain = [kw.strip() for kw in may_contain.split(',') if kw.strip()]
    if isinstance(must_not_contain, str):
        must_not_contain = [kw.strip() for kw in must_not_contain.split(',') if kw.strip()]
    
    try:
        # Get active preference
        preference = UserEmailPreference.query.filter(
            and_(
                UserEmailPreference.user_id == user.id,
                UserEmailPreference.deleted_at.is_(None)
            )
        ).first()
        
        if preference:
            # Update existing preferences
            preference.must_include_keywords = must_contain
            preference.can_include_keywords = may_contain
            preference.cannot_include_keywords = must_not_contain
            preference.updated_at = datetime.utcnow()
        else:
            # Create new preferences
            preference = UserEmailPreference(
                user_id=user.id,
                must_include_keywords=must_contain,
                can_include_keywords=may_contain,
                cannot_include_keywords=must_not_contain
            )
            db.session.add(preference)
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': {
                'must_contain': must_contain,
                'may_contain': may_contain,
                'must_not_contain': must_not_contain,
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating user preferences: {str(e)}")
        return jsonify({'error': 'Failed to update preferences'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/users/<int:user_id>/toggle-subscription', methods=['POST'])
@jwt_required()
def toggle_user_subscription(user_id):
    """Toggle user's subscription status."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), HTTPStatus.NOT_FOUND
    
    try:
        # Get active preference
        preference = UserEmailPreference.query.filter(
            and_(
                UserEmailPreference.user_id == user.id,
                UserEmailPreference.deleted_at.is_(None)
            )
        ).first()
        
        if preference:
            # Unsubscribe - soft delete
            preference.deleted_at = datetime.utcnow()
            preference.updated_at = datetime.utcnow()
            is_subscribed = False
        else:
            # Resubscribe - create new preference or restore last one
            last_preference = UserEmailPreference.query.filter(
                UserEmailPreference.user_id == user.id
            ).order_by(UserEmailPreference.updated_at.desc()).first()
            
            if last_preference:
                # Create new preference with same keywords
                new_preference = UserEmailPreference(
                    user_id=user.id,
                    must_include_keywords=last_preference.must_include_keywords,
                    can_include_keywords=last_preference.can_include_keywords,
                    cannot_include_keywords=last_preference.cannot_include_keywords
                )
                db.session.add(new_preference)
            else:
                # Create empty preference
                new_preference = UserEmailPreference(
                    user_id=user.id,
                    must_include_keywords=[],
                    can_include_keywords=[],
                    cannot_include_keywords=[]
                )
                db.session.add(new_preference)
            is_subscribed = True
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription toggled successfully',
            'is_subscribed': is_subscribed
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error toggling subscription: {str(e)}")
        return jsonify({'error': 'Failed to toggle subscription'}), HTTPStatus.INTERNAL_SERVER_ERROR

