from flask import request, jsonify
from http import HTTPStatus
from flask_jwt_extended import jwt_required
import json
from scrapers import upwork_scraper
from core.models import AppSettings, db
from utils.encryption import decrypt_api_key
from . import bp


@bp.route('/scrape', methods=['POST'])
@jwt_required()
def scrape_offers():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), HTTPStatus.BAD_REQUEST
    
    must_contain = data.get('must_contain', [])
    may_contain = data.get('may_contain', [])
    must_not_contain = data.get('must_not_contain', [])
    per_page = data.get('per_page', 10)  # Default to 10 for tests
    
    # Validate per_page
    try:
        per_page = int(per_page)
        if per_page < 1 or per_page > 100:
            return jsonify({'error': 'per_page must be between 1 and 100'}), HTTPStatus.BAD_REQUEST
    except (ValueError, TypeError):
        return jsonify({'error': 'per_page must be a valid number'}), HTTPStatus.BAD_REQUEST
    
    try:
        # Get Apify API key from database
        settings = AppSettings.query.first()
        apify_api_key = None
        
        if settings and settings.apify_api_key:
            try:
                apify_api_key = decrypt_api_key(settings.apify_api_key)
            except Exception as e:
                print(f"Error decrypting apify_api_key: {str(e)}")
        
        # If no API key, return error
        if not apify_api_key:
            return jsonify({
                'error': 'Brak klucza API Apify. Skonfiguruj klucz w ustawieniach przed rozpoczęciem scrapowania.'
            }), HTTPStatus.BAD_REQUEST
        
        # Build search URL
        search_url = upwork_scraper.get_search_url(must_contain, may_contain, must_not_contain, per_page)
        
        # Use dummy scrape for now to save credits
        # result = upwork_scraper.dummy_apify_scrape_offers(per_page)
        result = upwork_scraper.apify_scrape_offers(search_url, apify_api_key)
        
        raw_offers = result.get('offers', [])
        scrape_duration_ms = result.get('duration_millis')
        
        # Parse offers into structured format
        parsed_offers = []
        for offer in raw_offers:
            parsed_offer = {
                'title': offer.get('title'),
                'description': offer.get('description'),
                'budget': offer.get('budget'),
                'client_name': offer.get('clientLocation'),  # Using location as client identifier
                'url': offer.get('url'),
                'platform': upwork_scraper.PLATFORM,
                'posted_at': offer.get('absoluteDate'),
            }
            parsed_offers.append(parsed_offer)
        
        # Return both raw and parsed formats
        return jsonify({
            'search_url': search_url,
            'scrape_time_ms': scrape_duration_ms,
            'count': len(parsed_offers),
            'raw': json.dumps(raw_offers, indent=2),  # Raw as formatted text
            'parsed': parsed_offers  # Structured JSON
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error scraping offers: {str(e)}")
        return jsonify({'error': f'Wystąpił błąd podczas scrapowania ofert: {str(e)}'}), HTTPStatus.INTERNAL_SERVER_ERROR

