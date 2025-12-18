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
    Uses per-platform max_offers from settings.
    """
    data = request.get_json() or {}
    
    mode = data.get('mode', 'mock')  # 'real' or 'mock'
    score_mode = data.get('score_mode', 'mock')  # 'real' or 'mock' for OpenAI scoring
    must_contain = data.get('must_contain', [])
    may_contain = data.get('may_contain', [])
    must_not_contain = data.get('must_not_contain', [])
    platforms = data.get('platforms', [])  # Only scrape platforms passed from frontend
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
        'min_fit_score': settings.min_fit_score if settings else 5.0,
        'min_attractiveness_score': settings.min_attractiveness_score if settings else 5.0,
        'shuffle_keywords': settings.shuffle_keywords if settings else False,
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
    
    if 'min_fit_score' in data:
        value = float(data['min_fit_score'])
        settings.min_fit_score = max(1.0, min(10.0, value))
    
    if 'min_attractiveness_score' in data:
        value = float(data['min_attractiveness_score'])
        settings.min_attractiveness_score = max(1.0, min(10.0, value))
    
    if 'shuffle_keywords' in data:
        settings.shuffle_keywords = bool(data['shuffle_keywords'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ustawienia OpenAI zostały zaktualizowane',
    }), HTTPStatus.OK


@bp.route('/scrape/platforms', methods=['GET'])
@jwt_required()
def get_platforms():
    """Get list of available scraping platforms with their enabled status and max offers."""
    settings = AppSettings.query.first()
    enabled_list = settings.enabled_platforms if settings else []
    platform_max_offers = settings.platform_max_offers if settings else {}
    
    # Default max offers per platform
    default_max_offers = {
        'upwork': 50,
        'fiverr': 50,
        'useme': 50,
        'justjoinit': 50,
        'contra': 50,
        'rocketjobs': 50,
        'workconnect': 50,
    }
    
    platforms = []
    for platform_id in SCRAPER_REGISTRY.keys():
        platforms.append({
            'id': platform_id,
            'name': PLATFORM_NAMES.get(platform_id, platform_id.title()),
            'enabled': platform_id in enabled_list,
            'max_offers': platform_max_offers.get(platform_id, default_max_offers.get(platform_id, 50)) if platform_max_offers else default_max_offers.get(platform_id, 50),
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


@bp.route('/scrape/platforms/<platform_id>/max-offers', methods=['PUT'])
@jwt_required()
def update_platform_max_offers(platform_id: str):
    """Update max offers for a specific platform."""
    from sqlalchemy.orm.attributes import flag_modified
    
    if platform_id not in SCRAPER_REGISTRY:
        return jsonify({'error': f'Unknown platform: {platform_id}'}), HTTPStatus.BAD_REQUEST
    
    data = request.get_json()
    if not data or 'max_offers' not in data:
        return jsonify({'error': 'max_offers is required'}), HTTPStatus.BAD_REQUEST
    
    try:
        max_offers = int(data['max_offers'])
        if max_offers < 1 or max_offers > 200:
            return jsonify({'error': 'max_offers must be between 1 and 200'}), HTTPStatus.BAD_REQUEST
    except (ValueError, TypeError):
        return jsonify({'error': 'max_offers must be a valid number'}), HTTPStatus.BAD_REQUEST
    
    settings = AppSettings.query.first()
    if not settings:
        settings = AppSettings()
        db.session.add(settings)
    
    # Update or create the platform_max_offers dict
    platform_max_offers = dict(settings.platform_max_offers or {})
    platform_max_offers[platform_id] = max_offers
    
    settings.platform_max_offers = platform_max_offers
    flag_modified(settings, 'platform_max_offers')
    db.session.commit()
    
    return jsonify({
        'platform_id': platform_id,
        'max_offers': max_offers,
        'message': f'Max offers for {platform_id} updated to {max_offers}',
    }), HTTPStatus.OK


# ============================================================================
# WorkConnect specific endpoints
# ============================================================================

@bp.route('/scrape/workconnect/settings', methods=['GET'])
@jwt_required()
def get_workconnect_settings():
    """Get WorkConnect specific settings."""
    from core.models import CachedOffer
    
    settings = AppSettings.query.first()
    
    # Get cache stats
    cached_count = CachedOffer.query.filter_by(platform='workconnect').count()
    latest_cached = CachedOffer.query.filter_by(platform='workconnect')\
        .order_by(CachedOffer.created_at.desc()).first()
    
    return jsonify({
        'enabled': settings.workconnect_enabled if settings else False,
        'mock_enabled': settings.workconnect_mock_enabled if settings else False,
        'cache_hours': settings.workconnect_cache_hours if settings else 2.0,
        'max_offers': settings.workconnect_max_offers if settings else 50,
        'cache_stats': {
            'count': cached_count,
            'last_updated': (latest_cached.created_at.isoformat() + 'Z') if latest_cached else None,
        }
    }), HTTPStatus.OK


@bp.route('/scrape/workconnect/settings', methods=['PUT'])
@jwt_required()
def update_workconnect_settings():
    """Update WorkConnect specific settings."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    settings = AppSettings.query.first()
    if not settings:
        settings = AppSettings()
        db.session.add(settings)
    
    if 'enabled' in data:
        settings.workconnect_enabled = bool(data['enabled'])
    
    if 'mock_enabled' in data:
        settings.workconnect_mock_enabled = bool(data['mock_enabled'])
    
    if 'cache_hours' in data:
        try:
            cache_hours = float(data['cache_hours'])
            if cache_hours < 0.1 or cache_hours > 168:  # Max 1 week
                return jsonify({'error': 'cache_hours must be between 0.1 and 168'}), HTTPStatus.BAD_REQUEST
            settings.workconnect_cache_hours = cache_hours
        except (ValueError, TypeError):
            return jsonify({'error': 'cache_hours must be a valid number'}), HTTPStatus.BAD_REQUEST
    
    if 'max_offers' in data:
        try:
            max_offers = int(data['max_offers'])
            if max_offers < 1 or max_offers > 500:
                return jsonify({'error': 'max_offers must be between 1 and 500'}), HTTPStatus.BAD_REQUEST
            settings.workconnect_max_offers = max_offers
        except (ValueError, TypeError):
            return jsonify({'error': 'max_offers must be a valid number'}), HTTPStatus.BAD_REQUEST
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ustawienia WorkConnect zostały zaktualizowane',
        'enabled': settings.workconnect_enabled,
        'mock_enabled': settings.workconnect_mock_enabled,
        'cache_hours': settings.workconnect_cache_hours,
        'max_offers': settings.workconnect_max_offers,
    }), HTTPStatus.OK


@bp.route('/scrape/workconnect/refresh', methods=['POST'])
@jwt_required()
def refresh_workconnect_cache():
    """Force refresh WorkConnect cache."""
    from services.workconnect_service import refresh_workconnect_cache as do_refresh
    
    settings = AppSettings.query.first()
    max_offers = settings.workconnect_max_offers if settings and settings.workconnect_max_offers else 50
    
    result = do_refresh(max_offers=max_offers, print_logs=True)
    
    if result['success']:
        return jsonify({
            'message': f'Cache odświeżony - pobrano {result["offers_count"]} ofert',
            'offers_count': result['offers_count'],
            'duration_ms': result['duration_ms'],
            'cached_at': result['cached_at'],
        }), HTTPStatus.OK
    else:
        return jsonify({
            'error': result.get('error', 'Unknown error'),
            'offers_count': 0,
        }), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/scrape/workconnect/clear-cache', methods=['POST'])
@jwt_required()
def clear_workconnect_cache():
    """Clear WorkConnect cache without refreshing."""
    from services.workconnect_service import clear_cached_offers
    
    clear_cached_offers()
    
    return jsonify({
        'message': 'Cache WorkConnect został wyczyszczony',
    }), HTTPStatus.OK
