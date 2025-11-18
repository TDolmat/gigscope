from flask import Blueprint, request, jsonify
from core.config import CONFIG
from core.models import User, UserEmailPreference, db
from http import HTTPStatus
from datetime import datetime
from sqlalchemy import and_

bp = Blueprint('user', __name__, url_prefix='/user')


def parse_keywords(keywords_string):
    """Parse comma-separated keywords string into a list of trimmed keywords."""
    if not keywords_string or not keywords_string.strip():
        return []
    
    keywords = [kw.strip() for kw in keywords_string.split(',')]
    # Filter out empty strings
    keywords = [kw for kw in keywords if kw]
    return keywords


@bp.route('/subscribe', methods=['POST'])
def subscribe():
    """
    Subscribe a user to the newsletter with their keyword preferences.
    Creates User and UserEmailPreference records.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    email = data.get('email', '').strip()
    must_contain = data.get('mustContain', '')
    may_contain = data.get('mayContain', '')
    must_not_contain = data.get('mustNotContain', '')
    
    # Validation
    if not email:
        return jsonify({'error': 'Email jest wymagany'}), HTTPStatus.BAD_REQUEST
    
    # Parse keywords
    must_include_keywords = parse_keywords(must_contain)
    can_include_keywords = parse_keywords(may_contain)
    cannot_include_keywords = parse_keywords(must_not_contain)
    
    if not must_include_keywords:
        return jsonify({'error': 'Podaj przynajmniej jedno słowo kluczowe w sekcji "Musi zawierać"'}), HTTPStatus.BAD_REQUEST
    
    try:
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        
        if user:
            # User exists - check if they have active preferences
            active_preference = UserEmailPreference.query.filter(
                and_(
                    UserEmailPreference.user_id == user.id,
                    UserEmailPreference.deleted_at.is_(None)
                )
            ).first()
            
            if active_preference:
                # User is already subscribed - don't update, return info message
                return jsonify({
                    'error': 'Ten adres email jest już zapisany do otrzymywania ofert. Jeśli chcesz zmienić preferencje lub wypisać się, użyj linków w otrzymanym mailu.',
                    'already_subscribed': True
                }), HTTPStatus.CONFLICT
            else:
                # User previously unsubscribed - allow re-subscription
                active_preference = UserEmailPreference(
                    user_id=user.id,
                    must_include_keywords=must_include_keywords,
                    can_include_keywords=can_include_keywords,
                    cannot_include_keywords=cannot_include_keywords
                )
                db.session.add(active_preference)
                user.updated_at = datetime.utcnow()
        else:
            # Create new user
            user = User(email=email)
            db.session.add(user)
            db.session.flush()  # Get user.id
            
            # Create preferences
            preference = UserEmailPreference(
                user_id=user.id,
                must_include_keywords=must_include_keywords,
                can_include_keywords=can_include_keywords,
                cannot_include_keywords=cannot_include_keywords
            )
            db.session.add(preference)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pomyślnie zapisano preferencje',
            'email': user.email,
            'preferences_token': user.email_preferences_token,
            'unsubscribe_token': user.email_unsubscribe_token
        }), HTTPStatus.CREATED
        
    except Exception as e:
        db.session.rollback()
        print(f"Error subscribing user: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas zapisywania. Spróbuj ponownie.'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/preferences/<token>', methods=['GET'])
def get_preferences(token):
    """
    Get user preferences by token.
    """
    user = User.query.filter_by(email_preferences_token=token).first()
    
    if not user:
        return jsonify({'error': 'Nieprawidłowy token'}), HTTPStatus.NOT_FOUND
    
    # Get active preferences
    preference = UserEmailPreference.query.filter(
        and_(
            UserEmailPreference.user_id == user.id,
            UserEmailPreference.deleted_at.is_(None)
        )
    ).first()
    
    if not preference:
        return jsonify({
            'email': user.email,
            'mustContain': [],
            'mayContain': [],
            'mustNotContain': [],
            'is_subscribed': False
        }), HTTPStatus.OK
    
    return jsonify({
        'email': user.email,
        'mustContain': preference.must_include_keywords or [],
        'mayContain': preference.can_include_keywords or [],
        'mustNotContain': preference.cannot_include_keywords or [],
        'is_subscribed': True
    }), HTTPStatus.OK


@bp.route('/preferences/<token>', methods=['PUT'])
def update_preferences(token):
    """
    Update user preferences using token.
    """
    user = User.query.filter_by(email_preferences_token=token).first()
    
    if not user:
        return jsonify({'error': 'Nieprawidłowy token'}), HTTPStatus.NOT_FOUND
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    must_contain = data.get('mustContain', '')
    may_contain = data.get('mayContain', '')
    must_not_contain = data.get('mustNotContain', '')
    
    # Parse keywords
    must_include_keywords = parse_keywords(must_contain)
    can_include_keywords = parse_keywords(may_contain)
    cannot_include_keywords = parse_keywords(must_not_contain)
    
    if not must_include_keywords:
        return jsonify({'error': 'Podaj przynajmniej jedno słowo kluczowe w sekcji "Musi zawierać"'}), HTTPStatus.BAD_REQUEST
    
    try:
        # Get active preferences
        preference = UserEmailPreference.query.filter(
            and_(
                UserEmailPreference.user_id == user.id,
                UserEmailPreference.deleted_at.is_(None)
            )
        ).first()
        
        if preference:
            # Update existing preferences
            preference.must_include_keywords = must_include_keywords
            preference.can_include_keywords = can_include_keywords
            preference.cannot_include_keywords = cannot_include_keywords
            preference.updated_at = datetime.utcnow()
        else:
            # Create new preferences if they don't exist
            preference = UserEmailPreference(
                user_id=user.id,
                must_include_keywords=must_include_keywords,
                can_include_keywords=can_include_keywords,
                cannot_include_keywords=cannot_include_keywords
            )
            db.session.add(preference)
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Preferencje zostały zaktualizowane',
            'email': user.email
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating preferences: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas aktualizacji. Spróbuj ponownie.'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/unsubscribe/<token>', methods=['GET'])
def get_unsubscribe_info(token):
    """
    Get user info for unsubscribe page.
    """
    user = User.query.filter_by(email_unsubscribe_token=token).first()
    
    if not user:
        return jsonify({'error': 'Nieprawidłowy token'}), HTTPStatus.NOT_FOUND
    
    # Check if user has active subscription
    preference = UserEmailPreference.query.filter(
        and_(
            UserEmailPreference.user_id == user.id,
            UserEmailPreference.deleted_at.is_(None)
        )
    ).first()
    
    return jsonify({
        'email': user.email,
        'is_subscribed': preference is not None
    }), HTTPStatus.OK


@bp.route('/unsubscribe/<token>', methods=['POST'])
def unsubscribe(token):
    """
    Unsubscribe user from newsletter using token.
    Sets deleted_at on UserEmailPreference.
    """
    user = User.query.filter_by(email_unsubscribe_token=token).first()
    
    if not user:
        return jsonify({'error': 'Nieprawidłowy token'}), HTTPStatus.NOT_FOUND
    
    try:
        # Get active preferences
        preference = UserEmailPreference.query.filter(
            and_(
                UserEmailPreference.user_id == user.id,
                UserEmailPreference.deleted_at.is_(None)
            )
        ).first()
        
        if preference:
            # Soft delete - set deleted_at
            preference.deleted_at = datetime.utcnow()
            preference.updated_at = datetime.utcnow()
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Zostałeś wypisany z newslettera',
            'email': user.email
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error unsubscribing user: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas wypisywania. Spróbuj ponownie.'}), HTTPStatus.INTERNAL_SERVER_ERROR

