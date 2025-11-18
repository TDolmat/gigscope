from flask import Blueprint, request, jsonify
from core.config import CONFIG
from core.models import User, UserEmailPreference, UserSubscription, AppSettings, UserOfferEmail, Offer, db
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import and_, func
from collections import defaultdict

bp = Blueprint('admin', __name__, url_prefix='/admin')


@bp.route('/users', methods=['GET'])
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
    
    if not must_include:
        return jsonify({'error': 'must_include_keywords jest wymagane'}), HTTPStatus.BAD_REQUEST
    
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


@bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """
    Get application settings.
    """
    try:
        # Get or create settings (should only be one record)
        settings = AppSettings.query.first()
        
        if not settings:
            # Create default settings if none exist
            settings = AppSettings(
                enabled_platforms=[],
                email_frequency=AppSettings.EmailFrequency.DAILY.value,
                email_daytime='09:00',
                email_max_offers=15
            )
            db.session.add(settings)
            db.session.commit()
        
        return jsonify({
            'id': settings.id,
            'enabled_platforms': settings.enabled_platforms or [],
            'email_frequency': settings.email_frequency,
            'email_daytime': settings.email_daytime,
            'email_max_offers': settings.email_max_offers,
            'mail_api_key': settings.mail_api_key,
            'mail_sender_email': settings.mail_sender_email,
            'updated_at': settings.updated_at.isoformat() if settings.updated_at else None
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error fetching settings: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas pobierania ustawień'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    """
    Update application settings.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    try:
        # Get or create settings
        settings = AppSettings.query.first()
        
        if not settings:
            settings = AppSettings()
            db.session.add(settings)
        
        # Update fields if provided
        if 'enabled_platforms' in data:
            settings.enabled_platforms = data['enabled_platforms']
        
        if 'email_frequency' in data:
            settings.email_frequency = data['email_frequency']
        
        if 'email_daytime' in data:
            settings.email_daytime = data['email_daytime']
        
        if 'email_max_offers' in data:
            settings.email_max_offers = int(data['email_max_offers'])
        
        if 'mail_api_key' in data:
            settings.mail_api_key = data['mail_api_key']
        
        if 'mail_sender_email' in data:
            settings.mail_sender_email = data['mail_sender_email']
        
        settings.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Ustawienia zostały zaktualizowane',
            'settings': {
                'id': settings.id,
                'enabled_platforms': settings.enabled_platforms,
                'email_frequency': settings.email_frequency,
                'email_daytime': settings.email_daytime,
                'email_max_offers': settings.email_max_offers,
                'mail_api_key': settings.mail_api_key,
                'mail_sender_email': settings.mail_sender_email,
                'updated_at': settings.updated_at.isoformat()
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating settings: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas aktualizacji ustawień'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics including counts and time-series data.
    """
    try:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # 1. Active email subscribers (users with active circle subscription AND email preferences)
        active_email_subscribers = db.session.query(func.count(func.distinct(User.id))).filter(
            User.id.in_(
                db.session.query(UserEmailPreference.user_id).filter(
                    UserEmailPreference.deleted_at.is_(None)
                )
            ),
            User.email.in_(
                db.session.query(UserSubscription.email).filter(
                    UserSubscription.expires_at > now
                )
            )
        ).scalar() or 0
        
        # 2. Active circle subscribers
        active_circle_subscribers = db.session.query(func.count(UserSubscription.id)).filter(
            UserSubscription.expires_at > now
        ).scalar() or 0
        
        # 3. Total sent emails
        total_sent_emails = db.session.query(func.count(UserOfferEmail.id)).filter(
            UserOfferEmail.sent_at.isnot(None)
        ).scalar() or 0
        
        # 4. Total scraped offers
        total_scraped_offers = db.session.query(func.count(Offer.id)).scalar() or 0
        
        # Time-series data for last 30 days
        
        # 1. Sent emails per day (last 30 days)
        sent_emails_data = db.session.query(
            func.date(UserOfferEmail.sent_at).label('date'),
            func.count(UserOfferEmail.id).label('count')
        ).filter(
            UserOfferEmail.sent_at >= thirty_days_ago,
            UserOfferEmail.sent_at.isnot(None)
        ).group_by(
            func.date(UserOfferEmail.sent_at)
        ).all()
        
        # 2. Circle subscriptions created per day (last 30 days)
        circle_subs_data = db.session.query(
            func.date(UserSubscription.created_at).label('date'),
            func.count(UserSubscription.id).label('count')
        ).filter(
            UserSubscription.created_at >= thirty_days_ago
        ).group_by(
            func.date(UserSubscription.created_at)
        ).all()
        
        # 3. Offers scraped per day (last 30 days)
        offers_data = db.session.query(
            func.date(Offer.created_at).label('date'),
            func.count(Offer.id).label('count')
        ).filter(
            Offer.created_at >= thirty_days_ago
        ).group_by(
            func.date(Offer.created_at)
        ).all()
        
        # 4. GigScope subscriptions (email preferences) created per day (last 30 days)
        gigscope_subs_data = db.session.query(
            func.date(UserEmailPreference.created_at).label('date'),
            func.count(UserEmailPreference.id).label('count')
        ).filter(
            UserEmailPreference.created_at >= thirty_days_ago
        ).group_by(
            func.date(UserEmailPreference.created_at)
        ).all()
        
        # Format time-series data with all 30 days (fill missing days with 0)
        def format_timeseries(data, days=30):
            result = defaultdict(int)
            for item in data:
                result[item.date.isoformat()] = item.count
            
            # Fill all 30 days
            formatted = []
            for i in range(days):
                date = (now - timedelta(days=days-i-1)).date()
                formatted.append({
                    'date': date.isoformat(),
                    'count': result.get(date.isoformat(), 0)
                })
            
            return formatted
        
        return jsonify({
            'summary': {
                'active_email_subscribers': active_email_subscribers,
                'active_circle_subscribers': active_circle_subscribers,
                'total_sent_emails': total_sent_emails,
                'total_scraped_offers': total_scraped_offers,
            },
            'timeseries': {
                'sent_emails': format_timeseries(sent_emails_data),
                'circle_subscriptions': format_timeseries(circle_subs_data),
                'scraped_offers': format_timeseries(offers_data),
                'gigscope_subscriptions': format_timeseries(gigscope_subs_data),
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas pobierania statystyk'}), HTTPStatus.INTERNAL_SERVER_ERROR