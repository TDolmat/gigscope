from datetime import datetime
from core.models import db, User, UserEmailPreference, OfferBundle, Offer, AppSettings
from core.config import CONFIG
from scrapers.upwork_scraper import get_search_url, apify_scrape_offers
from utils.encryption import decrypt_api_key
from helpers.user_helper import is_user_subscribed, get_active_subscribed_users


def _scrape_and_store_offers(user_id, user_email, must_contain, may_contain, must_not_contain, apify_api_key, max_offers, print_logs = False):
    per_page = 10 if max_offers <= 10 else 50

    search_url = get_search_url(
        must_contain=must_contain,
        may_contain=may_contain,
        must_not_contain=must_not_contain,
        per_page=per_page
    )
    
    print(f"Scraping offers for user: {user_email}...")
    print(f"Search URL: {search_url}")

    scrape_result = apify_scrape_offers(
        url=search_url,
        api_key=apify_api_key,
        print_logs=print_logs
    )
    
    offers_data = scrape_result.get('offers', [])[:max_offers]
    duration_millis = scrape_result.get('duration_millis', 0)
    
    bundle = OfferBundle(
        user_id=user_id,
        scrape_duration_millis=duration_millis,
        scraped_at=datetime.utcnow(),
        must_include_keywords=must_contain,
        can_include_keywords=may_contain,
        cannot_include_keywords=must_not_contain
    )
    db.session.add(bundle)
    db.session.flush()
    
    offers = [
        Offer(
            offer_bundle_id=bundle.id,
            title=offer_data.get('title', ''),
            description=offer_data.get('description', ''),
            budget=offer_data.get('budget', ''),
            client_location=offer_data.get('clientLocation', ''),
            url=offer_data.get('url', ''),
            platform='upwork'
        )
        for offer_data in offers_data
    ]
    db.session.add_all(offers)
    db.session.commit()
    
    return {
        'success': True,
        'user_id': user_id,
        'bundle_id': bundle.id,
        'offers_count': len(offers_data),
        'duration_millis': duration_millis,
        'scrape_duration_millis': duration_millis
    }


def scrape_offers_for_user(user_id: int, print_logs: bool = False) -> dict:
    try:
        if not is_user_subscribed(user_id):
            raise Exception('User does not have active subscription')
        
        user = User.query.filter(User.id == user_id).first()
        if not user:
            raise Exception('User not found')
        
        preferences = UserEmailPreference.query.filter(
            UserEmailPreference.user_id == user_id,
            UserEmailPreference.deleted_at.is_(None)
        ).first()
        if not preferences:
            raise Exception('User has no active email preferences')
        
        app_settings = AppSettings.query.first()
        if not app_settings:
            raise Exception('App settings not found')
        
        apify_api_key = decrypt_api_key(app_settings.apify_api_key)
        if not apify_api_key:
            raise Exception('Apify API key not configured')
        
        max_offers = app_settings.email_max_offers or CONFIG.DEFAULT_MAX_MAIL_OFFERS

        must_contain = preferences.must_include_keywords or []
        may_contain = preferences.can_include_keywords or []
        must_not_contain = preferences.cannot_include_keywords or []
        
        result = _scrape_and_store_offers(
            user_id=user_id,
            user_email=user.email,
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            apify_api_key=apify_api_key,
            max_offers=max_offers,
            print_logs=print_logs
        )
        
        return {
            'success': True,
            'message': f'Successfully scraped {result["offers_count"]} offers',
            'bundle_id': result['bundle_id'],
            'offers_count': result['offers_count'],
            'duration_millis': result['duration_millis']
        }
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'message': f'Error scraping offers: {str(e)}',
            'bundle_id': None,
            'offers_count': 0,
            'duration_millis': 0
        }

def scrape_offers_for_all_users(print_logs: bool = False) -> dict:
    try:
        active_users = get_active_subscribed_users()
        app_settings = AppSettings.query.first()
        apify_api_key = decrypt_api_key(app_settings.apify_api_key)

        max_offers = app_settings.email_max_offers or CONFIG.DEFAULT_MAX_MAIL_OFFERS

        if not active_users:
            raise Exception('No active subscribed users found')
        
        print(f"Scraping offers for {len(active_users)} active subscribed users...")

        results = []
        successful = 0
        failed = 0
        total_scraped_offers = 0

        
        for user_info in active_users:
            user_id, user_email, must_contain, may_contain, must_not_contain = user_info[0], user_info[1], user_info[2], user_info[3], user_info[4] 

            try:
                result = _scrape_and_store_offers(
                    user_id=user_id,
                    user_email=user_email,
                    must_contain=must_contain,
                    may_contain=may_contain,
                    must_not_contain=must_not_contain,
                    apify_api_key=apify_api_key,
                    max_offers=max_offers,
                    print_logs=print_logs
                )

                total_scraped_offers += result['offers_count']
                successful += 1

                results.append({
                    'user_id': user_id,
                    'user_email': user_email,
                    'bundle_id': result['bundle_id'],
                    'offers_count': result['offers_count'],
                    'duration_millis': result['duration_millis'],
                    'success': True
                })
            except Exception as e:
                db.session.rollback()
                failed += 1
                results.append({
                    'user_id': user_id,
                    'user_email': user_email,
                    'bundle_id': None,
                    'offers_count': 0,
                    'duration_millis': 0,
                    'success': False,
                    'error': str(e)
                })
        
        total_duration_millis = sum(result['duration_millis'] for result in results)
        average_duration_millis = total_duration_millis / len(active_users)

        return {
            'total_users': len(active_users),
            'successful_scrapes': successful,
            'failed_scrapes': failed,
            'total_scraped_offers': total_scraped_offers,
            'results': results,
            'total_duration_millis': total_duration_millis,
            'average_duration_millis': average_duration_millis
        }
    except Exception as e:
        db.session.rollback()
        return {
            'total_users': 0,
            'successful_scrapes': 0,
            'failed_scrapes': 0,
            'total_scraped_offers': 0,
            'results': [],
            'error': str(e)
        }
