from flask import request, jsonify
from http import HTTPStatus
from flask_jwt_extended import jwt_required
import json
from typing import Set
from scrapers import get_scraper, SCRAPER_REGISTRY, PLATFORM_NAMES
from services.scrape import scrape_all_platforms
from services.openai_scoring import DEFAULT_SCORING_PROMPT
from core.models import AppSettings, Offer, OfferBundle, db
from utils.encryption import decrypt_api_key, encrypt_api_key
from . import bp


def get_existing_offer_urls() -> Set[str]:
    """
    Get all offer URLs that exist in the database (from sent bundles).
    This is used for the admin test scrape to show which offers were already sent.
    """
    # Get URLs from all offers in bundles that have been sent
    sent_offers = db.session.query(Offer.url).join(
        OfferBundle,
        Offer.offer_bundle_id == OfferBundle.id
    ).filter(
        OfferBundle.user_offer_email_id.isnot(None),  # Bundle was used in an email
        Offer.deleted_at.is_(None)
    ).distinct().all()
    
    return {offer.url for offer in sent_offers}


@bp.route('/scrape', methods=['POST'])
@jwt_required()
def scrape_offers():
    """
    Test scrape for a specific platform.
    Supports both real and mock modes.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    platform = data.get('platform', 'upwork')
    mode = data.get('mode', 'real')  # 'real' or 'mock'
    must_contain = data.get('must_contain', [])
    may_contain = data.get('may_contain', [])
    must_not_contain = data.get('must_not_contain', [])
    per_page = data.get('per_page', 10)
    
    # Validate per_page
    try:
        per_page = int(per_page)
        if per_page < 1 or per_page > 100:
            return jsonify({'error': 'per_page must be between 1 and 100'}), HTTPStatus.BAD_REQUEST
    except (ValueError, TypeError):
        return jsonify({'error': 'per_page must be a valid number'}), HTTPStatus.BAD_REQUEST
    
    # Validate platform
    if platform not in SCRAPER_REGISTRY:
        return jsonify({
            'error': f'Unknown platform: {platform}. Available: {list(SCRAPER_REGISTRY.keys())}'
        }), HTTPStatus.BAD_REQUEST
    
    try:
        scraper = get_scraper(platform)
        
        if mode == 'mock':
            # Mock mode - no API key needed
            result = scraper.scrape_mock(
                must_contain=must_contain,
                may_contain=may_contain,
                must_not_contain=must_not_contain,
                max_offers=per_page,
            )
        else:
            # Real mode - need API key
            settings = AppSettings.query.first()
            api_key = None
            
            if platform == 'upwork' and settings and settings.apify_api_key:
                try:
                    api_key = decrypt_api_key(settings.apify_api_key)
                except Exception as e:
                    print(f"Error decrypting apify_api_key: {str(e)}")
            
            if platform == 'upwork' and not api_key:
                return jsonify({
                    'error': f'Brak klucza API dla platformy {platform}. Skonfiguruj klucz w ustawieniach przed rozpoczęciem scrapowania.'
                }), HTTPStatus.BAD_REQUEST
            
            result = scraper.scrape(
                must_contain=must_contain,
                may_contain=may_contain,
                must_not_contain=must_not_contain,
                max_offers=per_page,
                api_key=api_key,
            )
        
        if result.error:
            return jsonify({'error': result.error}), HTTPStatus.BAD_REQUEST
        
        # Convert to response format
        parsed_offers = [offer.to_dict() for offer in result.offers]
        
        # Mark offers that already exist in the database (were sent to someone)
        existing_urls = get_existing_offer_urls()
        for offer in parsed_offers:
            offer['exists_in_database'] = offer.get('url', '') in existing_urls
        
        return jsonify({
            'platform': result.platform,
            'mode': mode,
            'search_url': result.search_url,
            'scrape_time_ms': result.duration_millis,
            'count': len(parsed_offers),
            'raw': json.dumps([o.to_dict() for o in result.offers], indent=2),
            'parsed': parsed_offers
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error scraping offers: {str(e)}")
        return jsonify({'error': f'Wystąpił błąd podczas scrapowania ofert: {str(e)}'}), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/scrape/all', methods=['POST'])
@jwt_required()
def scrape_all_platforms_endpoint():
    """
    Scrape from all enabled platforms, score with OpenAI, and return diverse results.
    This mirrors the logic used in manual runs and scheduler.
    """
    data = request.get_json() or {}
    
    mode = data.get('mode', 'mock')  # 'real' or 'mock'
    score_mode = data.get('score_mode', 'mock')  # 'real' or 'mock' for OpenAI scoring
    must_contain = data.get('must_contain', [])
    may_contain = data.get('may_contain', [])
    must_not_contain = data.get('must_not_contain', [])
    platforms = data.get('platforms', [])  # Only scrape platforms passed from frontend
    per_platform = data.get('per_platform', 10)
    max_offers = data.get('max_offers', 10)
    
    # Filter to only enabled platforms that exist
    valid_platforms = [p for p in platforms if p in SCRAPER_REGISTRY]
    
    if not valid_platforms:
        return jsonify({
            'error': 'No valid platforms selected'
        }), HTTPStatus.BAD_REQUEST
    
    result = scrape_all_platforms(
        must_contain=must_contain,
        may_contain=may_contain,
        must_not_contain=must_not_contain,
        enabled_platforms=valid_platforms,
        per_platform=per_platform,
        max_offers=max_offers,
        use_real_scrape=(mode == 'real'),
        use_real_scoring=(score_mode == 'real'),
        print_logs=True,
    )
    
    # Mark offers that already exist in the database (were sent to someone)
    existing_urls = get_existing_offer_urls()
    for offer in result['all_offers']:
        offer['exists_in_database'] = offer.get('url', '') in existing_urls
    for offer in result['selected_offers']:
        offer['exists_in_database'] = offer.get('url', '') in existing_urls
    
    return jsonify({
        'mode': mode,
        'score_mode': score_mode,
        'total_offers': result['total_offers'],
        'selected_count': result['selected_count'],
        'max_offers': result['max_offers'],
        'total_duration_ms': result['total_duration_ms'],
        'platform_results': result['platform_results'],
        'all_offers': result['all_offers'],
        'selected_offers': result['selected_offers'],
    }), HTTPStatus.OK


@bp.route('/scrape/test-keywords', methods=['GET'])
@jwt_required()
def get_test_keywords():
    """Get saved test keywords."""
    settings = AppSettings.query.first()
    
    return jsonify({
        'must_contain': settings.test_must_contain if settings else [],
        'may_contain': settings.test_may_contain if settings else [],
        'must_not_contain': settings.test_must_not_contain if settings else [],
    }), HTTPStatus.OK


@bp.route('/scrape/test-keywords', methods=['PUT'])
@jwt_required()
def update_test_keywords():
    """Save test keywords for quick testing."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    settings = AppSettings.query.first()
    if not settings:
        settings = AppSettings()
        db.session.add(settings)
    
    if 'must_contain' in data:
        settings.test_must_contain = data['must_contain']
    if 'may_contain' in data:
        settings.test_may_contain = data['may_contain']
    if 'must_not_contain' in data:
        settings.test_must_not_contain = data['must_not_contain']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Testowe słowa kluczowe zostały zapisane',
        'must_contain': settings.test_must_contain,
        'may_contain': settings.test_may_contain,
        'must_not_contain': settings.test_must_not_contain,
    }), HTTPStatus.OK


@bp.route('/scrape/openai-settings', methods=['GET'])
@jwt_required()
def get_openai_settings():
    """Get OpenAI settings for scoring."""
    settings = AppSettings.query.first()
    
    openai_key = None
    if settings and settings.openai_api_key:
        try:
            openai_key = decrypt_api_key(settings.openai_api_key)
        except Exception:
            pass
    
    return jsonify({
        'openai_api_key': openai_key,
        'openai_scoring_prompt': settings.openai_scoring_prompt if settings else None,
        'default_prompt': DEFAULT_SCORING_PROMPT,
        'email_max_offers': settings.email_max_offers if settings else 10,
    }), HTTPStatus.OK


@bp.route('/scrape/openai-settings', methods=['PUT'])
@jwt_required()
def update_openai_settings():
    """Update OpenAI settings for scoring."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    settings = AppSettings.query.first()
    if not settings:
        settings = AppSettings()
        db.session.add(settings)
    
    if 'openai_api_key' in data:
        key = data['openai_api_key']
        if key:
            settings.openai_api_key = encrypt_api_key(key)
        else:
            settings.openai_api_key = None
    
    if 'openai_scoring_prompt' in data:
        settings.openai_scoring_prompt = data['openai_scoring_prompt']
    
    if 'email_max_offers' in data:
        settings.email_max_offers = int(data['email_max_offers'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ustawienia OpenAI zostały zaktualizowane',
    }), HTTPStatus.OK


@bp.route('/scrape/platforms', methods=['GET'])
@jwt_required()
def get_platforms():
    """Get list of available scraping platforms with their enabled status."""
    settings = AppSettings.query.first()
    enabled_list = settings.enabled_platforms if settings else []
    
    platforms = []
    for platform_id in SCRAPER_REGISTRY.keys():
        platforms.append({
            'id': platform_id,
            'name': PLATFORM_NAMES.get(platform_id, platform_id.title()),
            'enabled': platform_id in enabled_list,
        })
    
    return jsonify({
        'platforms': platforms,
    }), HTTPStatus.OK


@bp.route('/scrape/platforms/<platform_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_platform(platform_id: str):
    """Toggle a platform's enabled status."""
    from sqlalchemy.orm.attributes import flag_modified
    
    if platform_id not in SCRAPER_REGISTRY:
        return jsonify({'error': f'Unknown platform: {platform_id}'}), HTTPStatus.BAD_REQUEST
    
    settings = AppSettings.query.first()
    if not settings:
        settings = AppSettings(enabled_platforms=[])
        db.session.add(settings)
    
    # Create a new list to ensure SQLAlchemy detects the change
    enabled_list = list(settings.enabled_platforms or [])
    
    if platform_id in enabled_list:
        enabled_list.remove(platform_id)
        enabled = False
    else:
        enabled_list.append(platform_id)
        enabled = True
    
    # Assign a new list and flag as modified for JSON column
    settings.enabled_platforms = enabled_list
    flag_modified(settings, 'enabled_platforms')
    db.session.commit()
    
    return jsonify({
        'platform_id': platform_id,
        'enabled': enabled,
        'enabled_platforms': enabled_list,
    }), HTTPStatus.OK
