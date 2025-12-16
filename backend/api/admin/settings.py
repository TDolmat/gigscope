from flask import request, jsonify
from core.models import AppSettings, db
from core.config import CONFIG
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from datetime import datetime
from utils.encryption import encrypt_api_key, decrypt_api_key
from . import bp


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
                email_max_offers=CONFIG.DEFAULT_MAX_MAIL_OFFERS
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
            'upwork_max_offers': settings.upwork_max_offers or 50,
            'allow_duplicate_offers': settings.allow_duplicate_offers if settings.allow_duplicate_offers is not None else False,
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
        
        if 'upwork_max_offers' in data:
            settings.upwork_max_offers = int(data['upwork_max_offers'])
        
        if 'allow_duplicate_offers' in data:
            settings.allow_duplicate_offers = bool(data['allow_duplicate_offers'])
        
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
                'upwork_max_offers': settings.upwork_max_offers,
                'allow_duplicate_offers': settings.allow_duplicate_offers if settings.allow_duplicate_offers is not None else False,
                'updated_at': settings.updated_at.isoformat()
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating settings: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas aktualizacji ustawień'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/settings/apify-key', methods=['GET'])
@jwt_required()
def get_apify_key():
    """
    Get Apify API key (decrypted).
    Separate endpoint for security.
    """
    try:
        settings = AppSettings.query.first()
        
        if not settings:
            return jsonify({'apify_api_key': None}), HTTPStatus.OK
        
        # Decrypt apify_api_key if it exists
        decrypted_apify_key = None
        if settings.apify_api_key:
            try:
                decrypted_apify_key = decrypt_api_key(settings.apify_api_key)
            except Exception as e:
                print(f"Error decrypting apify_api_key: {str(e)}")
                return jsonify({'error': 'Błąd deszyfrowania klucza API'}), HTTPStatus.INTERNAL_SERVER_ERROR
        
        return jsonify({
            'apify_api_key': decrypted_apify_key
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error fetching apify key: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas pobierania klucza API'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/settings/apify-key', methods=['PUT'])
@jwt_required()
def update_apify_key():
    """
    Update Apify API key (encrypted storage).
    Separate endpoint for security.
    """
    data = request.get_json()
    
    if not data or 'apify_api_key' not in data:
        return jsonify({'error': 'apify_api_key jest wymagane'}), HTTPStatus.BAD_REQUEST
    
    try:
        # Get or create settings
        settings = AppSettings.query.first()
        
        if not settings:
            settings = AppSettings()
            db.session.add(settings)
        
        # Encrypt and store the API key
        apify_key = data['apify_api_key']
        if apify_key:
            settings.apify_api_key = encrypt_api_key(apify_key)
        else:
            settings.apify_api_key = None
        
        settings.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Return decrypted key in response for confirmation
        decrypted_key = decrypt_api_key(settings.apify_api_key) if settings.apify_api_key else None
        
        return jsonify({
            'message': 'Klucz API został zaktualizowany',
            'apify_api_key': decrypted_key
        }), HTTPStatus.OK
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating apify key: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas aktualizacji klucza API'}), HTTPStatus.INTERNAL_SERVER_ERROR

