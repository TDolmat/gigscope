from flask import request, jsonify
from core.models import User, UserEmailPreference, UserSubscription, db
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from datetime import datetime
from sqlalchemy import and_
from . import bp


@bp.route('/users', methods=['GET']),
@jwt_required()
def get_users():
    """
    Get all users with their preferences and subscriptions.
    """
    try:
        users = User.query.all()
        users_data = []
        
        for user in users:
            # Get active preferences
            preference = UserEmailPreference.query.filter(
                UserEmailPreference.user_id == user.id,
                UserEmailPreference.deleted_at.is_(None)
            ).order_by(
                UserEmailPreference.created_at.desc()
            ).first()
            
            # Get active subscription
            subscription = UserSubscription.query.filter(
                UserSubscription.email == user.email
            ).order_by(
                UserSubscription.expires_at.desc()
            ).first()
            
            user_dict = {
                'id': user.id,
                'email': user.email,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'preferences': {
                    'id': preference.id if preference else None,
                    'must_include_keywords': preference.must_include_keywords if preference else [],
                    'can_include_keywords': preference.can_include_keywords if preference else [],
                    'cannot_include_keywords': preference.cannot_include_keywords if preference else [],
                    'created_at': preference.created_at.isoformat() if preference and preference.created_at else None,
                    'updated_at': preference.updated_at.isoformat() if preference and preference.updated_at else None,
                    'deleted_at': preference.deleted_at.isoformat() if preference and preference.deleted_at else None,
                } if preference else None,
                'subscription': {
                    'id': subscription.id if subscription else None,
                    'subscribed_at': subscription.subscribed_at.isoformat() if subscription and subscription.subscribed_at else None,
                    'expires_at': subscription.expires_at.isoformat() if subscription and subscription.expires_at else None,
                    'is_active': subscription.expires_at > datetime.utcnow() if subscription else False,
                } if subscription else None
            }
            users_data.append(user_dict)
        
        return jsonify(users_data), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas pobierania użytkowników'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/users/<int:user_id>/preferences', methods=['PUT'])
@jwt_required()
def update_user_preferences(user_id):
    """
    Update user keyword preferences.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    must_include = data.get('must_include_keywords', [])
    can_include = data.get('can_include_keywords', [])
    cannot_include = data.get('cannot_include_keywords', [])
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Użytkownik nie znaleziony'}), HTTPStatus.NOT_FOUND
        
        # Get active preferences
        preference = UserEmailPreference.query.filter(
            and_(
                UserEmailPreference.user_id == user.id,
                UserEmailPreference.deleted_at.is_(None)
            )
        ).first()
        
        if preference:
            # Update existing
            preference.must_include_keywords = must_include
            preference.can_include_keywords = can_include
            preference.cannot_include_keywords = cannot_include
            preference.updated_at = datetime.utcnow()
        else:
            # Create new
            preference = UserEmailPreference(
                user_id=user.id,
                must_include_keywords=must_include,
                can_include_keywords=can_include,
                cannot_include_keywords=cannot_include
            )
            db.session.add(preference)
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Preferencje zostały zaktualizowane',
            'user_id': user.id
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating preferences: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas aktualizacji preferencji'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/users/<int:user_id>/subscription', methods=['POST'])
@jwt_required()
def set_user_subscription(user_id):
    """
    Set or update user subscription.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    expires_at_str = data.get('expires_at')
    
    if not expires_at_str:
        return jsonify({'error': 'expires_at jest wymagane'}), HTTPStatus.BAD_REQUEST
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Użytkownik nie znaleziony'}), HTTPStatus.NOT_FOUND
        
        # Parse datetime (expecting ISO format from frontend)
        try:
            expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Nieprawidłowy format daty. Użyj ISO 8601 format.'}), HTTPStatus.BAD_REQUEST
        
        # Check if subscription already exists
        subscription = UserSubscription.query.filter_by(email=user.email).order_by(UserSubscription.expires_at.desc()).first()
        
        if subscription:
            # Update existing
            subscription.expires_at = expires_at
            subscription.updated_at = datetime.utcnow()
        else:
            # Create new
            subscription = UserSubscription(
                email=user.email,
                subscribed_at=datetime.utcnow(),
                expires_at=expires_at
            )
            db.session.add(subscription)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Subskrypcja została zaktualizowana',
            'subscription': {
                'id': subscription.id,
                'expires_at': subscription.expires_at.isoformat(),
                'is_active': subscription.expires_at > datetime.utcnow()
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error setting subscription: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas ustawiania subskrypcji'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/users/<int:user_id>/subscription', methods=['DELETE'])
@jwt_required()
def delete_user_subscription(user_id):
    """
    Delete user subscription.
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Użytkownik nie znaleziony'}), HTTPStatus.NOT_FOUND
        
        # Delete all subscriptions for this user
        UserSubscription.query.filter_by(email=user.email).delete()
        db.session.commit()
        
        return jsonify({
            'message': 'Subskrypcja została usunięta'
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting subscription: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas usuwania subskrypcji'}), HTTPStatus.INTERNAL_SERVER_ERROR

