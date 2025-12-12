"""
Scraping service that handles multi-platform scraping with scoring and diversity.
Used by manual runs, scheduler, and admin API.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from core.models import db, User, UserEmailPreference, OfferBundle, Offer, AppSettings, ScrapeLog
from core.config import CONFIG
from scrapers import get_scraper, SCRAPER_REGISTRY, get_platform_name
from services.openai_scoring import score_offers_with_openai, score_offers_mock, select_offers_with_diversity
from utils.encryption import decrypt_api_key
from helpers.user_helper import get_active_subscribed_users


def scrape_all_platforms(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    enabled_platforms: List[str],
    per_platform: int = 10,
    max_offers: int = 10,
    use_real_scrape: bool = True,
    use_real_scoring: bool = True,
    print_logs: bool = False,
) -> Dict[str, Any]:
    """
    Scrape from all enabled platforms, score with OpenAI, and return diverse results.
    This is the main scraping function used by manual runs and scheduler.
    
    Args:
        must_contain: Required keywords
        may_contain: Optional keywords
        must_not_contain: Excluded keywords
        enabled_platforms: List of platform IDs to scrape
        per_platform: Max offers to scrape per platform
        max_offers: Final max offers after scoring/selection
        use_real_scrape: If True, use real scrapers; if False, use mock
        use_real_scoring: If True, use OpenAI scoring; if False, use mock
        print_logs: Whether to print debug logs
    
    Returns:
        Dict with scrape results, scores, and selected offers
    """
    settings = AppSettings.query.first()
    
    # Collect results from all platforms
    all_offers = []
    platform_results = {}
    total_duration = 0
    
    for platform in enabled_platforms:
        if platform not in SCRAPER_REGISTRY:
            platform_results[platform] = {'count': 0, 'error': f'Unknown platform: {platform}'}
            continue
        
        try:
            scraper = get_scraper(platform)
            
            if use_real_scrape:
                # Get appropriate API key for platform
                api_key = None
                if platform == 'upwork' and settings and settings.apify_api_key:
                    api_key = decrypt_api_key(settings.apify_api_key)
                
                if platform == 'upwork' and not api_key:
                    platform_results[platform] = {
                        'count': 0,
                        'error': f'No API key configured for {platform}'
                    }
                    continue
                
                result = scraper.scrape(
                    must_contain=must_contain,
                    may_contain=may_contain,
                    must_not_contain=must_not_contain,
                    max_offers=per_platform,
                    api_key=api_key,
                    print_logs=print_logs,
                )
            else:
                result = scraper.scrape_mock(
                    must_contain=must_contain,
                    may_contain=may_contain,
                    must_not_contain=must_not_contain,
                    max_offers=per_platform,
                )
            
            platform_results[platform] = {
                'count': len(result.offers),
                'duration_ms': result.duration_millis,
                'search_url': result.search_url,
                'error': result.error,
            }
            
            total_duration += result.duration_millis or 0
            
            # Add offers to combined list
            for offer in result.offers:
                all_offers.append(offer.to_dict())
                
        except Exception as e:
            platform_results[platform] = {'count': 0, 'error': str(e)}
            if print_logs:
                print(f"Error scraping {platform}: {e}")
    
    # Score all offers
    scores = []
    if all_offers:
        if use_real_scoring and settings and settings.openai_api_key:
            try:
                openai_key = decrypt_api_key(settings.openai_api_key)
                custom_prompt = settings.openai_scoring_prompt
                scores = score_offers_with_openai(
                    offers=all_offers,
                    must_contain=must_contain,
                    may_contain=may_contain,
                    must_not_contain=must_not_contain,
                    api_key=openai_key,
                    custom_prompt=custom_prompt,
                )
            except Exception as e:
                if print_logs:
                    print(f"OpenAI scoring error: {e}")
                scores = score_offers_mock(all_offers, must_contain, may_contain, must_not_contain)
        else:
            scores = score_offers_mock(all_offers, must_contain, may_contain, must_not_contain)
    
    # Attach scores to offers
    for i, offer in enumerate(all_offers):
        if i < len(scores):
            offer['fit_score'] = scores[i].fit_score
            offer['attractiveness_score'] = scores[i].attractiveness_score
            offer['overall_score'] = scores[i].overall_score
        else:
            offer['fit_score'] = 5.0
            offer['attractiveness_score'] = 5.0
            offer['overall_score'] = 5.0
    
    # Sort by overall score
    all_offers.sort(key=lambda x: x.get('overall_score', 0), reverse=True)
    
    # Select offers with diversity
    selected_offers = select_offers_with_diversity(all_offers, max_offers)
    
    # Mark which offers are selected vs excluded
    selected_urls = {o['url'] for o in selected_offers}
    for offer in all_offers:
        offer['selected'] = offer['url'] in selected_urls
    
    return {
        'total_offers': len(all_offers),
        'selected_count': len(selected_offers),
        'max_offers': max_offers,
        'total_duration_ms': total_duration,
        'platform_results': platform_results,
        'all_offers': all_offers,
        'selected_offers': selected_offers,
    }


def scrape_and_store_for_user(
    user_id: int,
    user_email: str,
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    print_logs: bool = False,
) -> Dict[str, Any]:
    """
    Scrape offers for a single user using multi-platform logic and store in database.
    Only stores the selected offers (within max_offers limit).
    """
    settings = AppSettings.query.first()
    if not settings:
        raise Exception('App settings not found')
    
    enabled_platforms = settings.enabled_platforms or []
    if not enabled_platforms:
        raise Exception('No platforms enabled for scraping')
    
    max_offers = settings.email_max_offers or CONFIG.DEFAULT_MAX_MAIL_OFFERS
    
    if print_logs:
        print(f"Scraping offers for user: {user_email}...")
        print(f"Enabled platforms: {enabled_platforms}")
        print(f"Max offers: {max_offers}")
    
    # Scrape all platforms with real scraping and scoring
    result = scrape_all_platforms(
        must_contain=must_contain,
        may_contain=may_contain,
        must_not_contain=must_not_contain,
        enabled_platforms=enabled_platforms,
        per_platform=max_offers,  # Get enough per platform
        max_offers=max_offers,
        use_real_scrape=True,
        use_real_scoring=True,
        print_logs=print_logs,
    )
    
    # Create bundle and store only selected offers
    bundle = OfferBundle(
        user_id=user_id,
        scrape_duration_millis=result['total_duration_ms'],
        scraped_at=datetime.utcnow(),
        must_include_keywords=must_contain,
        can_include_keywords=may_contain,
        cannot_include_keywords=must_not_contain
    )
    db.session.add(bundle)
    db.session.flush()
    
    # Store only selected offers (the ones that will go in the email)
    offers = []
    for offer_data in result['selected_offers']:
        offer = Offer(
            offer_bundle_id=bundle.id,
            title=offer_data.get('title', ''),
            description=offer_data.get('description', ''),
            budget=offer_data.get('budget', ''),
            client_location=offer_data.get('client_location', ''),
            url=offer_data.get('url', ''),
            platform=offer_data.get('platform', 'unknown'),
            fit_score=offer_data.get('fit_score'),
            attractiveness_score=offer_data.get('attractiveness_score'),
            overall_score=offer_data.get('overall_score'),
        )
        offers.append(offer)
    
    db.session.add_all(offers)
    db.session.commit()
    
    return {
        'success': True,
        'user_id': user_id,
        'bundle_id': bundle.id,
        'offers_count': len(offers),
        'total_scraped': result['total_offers'],
        'duration_millis': result['total_duration_ms'],
        'platform_results': result['platform_results'],
    }


def scrape_offers_for_user(user_id: int, print_logs: bool = False) -> dict:
    """Scrape offers for a single user. Checks BeFreeClub subscription status."""
    from helpers.user_helper import is_email_subscribed
    
    try:
        user = User.query.filter(User.id == user_id).first()
        if not user:
            raise Exception('User not found')
        
        # Check if user's email is in BeFreeClub subscribers list
        if not is_email_subscribed(user.email):
            raise Exception('User does not have active BeFreeClub subscription')
        
        preferences = UserEmailPreference.query.filter(
            UserEmailPreference.user_id == user_id,
            UserEmailPreference.deleted_at.is_(None)
        ).first()
        if not preferences:
            raise Exception('User has no active email preferences')
        
        must_contain = preferences.must_include_keywords or []
        may_contain = preferences.can_include_keywords or []
        must_not_contain = preferences.cannot_include_keywords or []
        
        result = scrape_and_store_for_user(
            user_id=user_id,
            user_email=user.email,
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            print_logs=print_logs
        )
        
        return {
            'success': True,
            'message': f'Successfully scraped {result["offers_count"]} offers (from {result["total_scraped"]} total)',
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
    """
    Scrape offers for all users with active BeFreeClub subscription.
    Uses multi-platform scraping with scoring and diversity.
    """
    # Set running flag
    settings = AppSettings.query.first()
    if settings:
        settings.is_scrape_running = True
        settings.scrape_started_at = datetime.utcnow()
        db.session.commit()
    
    try:
        # Get active users (this fetches subscribers from BeFreeClub API)
        active_users = get_active_subscribed_users()
        
        if not active_users:
            print("No active subscribed users found")
            # Clear running flag
            if settings:
                settings.is_scrape_running = False
                settings.scrape_started_at = None
                db.session.commit()
            return {
                'total_users': 0,
                'successful_scrapes': 0,
                'failed_scrapes': 0,
                'total_scraped_offers': 0,
                'results': [],
                'total_duration_millis': 0,
                'average_duration_millis': 0
            }
        
        print(f"Scraping offers for {len(active_users)} active BeFreeClub subscribers...")

        results = []
        successful = 0
        failed = 0
        total_scraped_offers = 0
        
        for user_info in active_users:
            user_id, user_email, must_contain, may_contain, must_not_contain = (
                user_info[0], user_info[1], user_info[2], user_info[3], user_info[4]
            )

            try:
                result = scrape_and_store_for_user(
                    user_id=user_id,
                    user_email=user_email,
                    must_contain=must_contain or [],
                    may_contain=may_contain or [],
                    must_not_contain=must_not_contain or [],
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
        average_duration_millis = total_duration_millis / len(active_users) if active_users else 0

        # Collect errors for the log
        errors = [
            {'user_id': r['user_id'], 'email': r['user_email'], 'error': r.get('error', '')}
            for r in results if not r['success']
        ]

        # Save ScrapeLog
        scrape_log = ScrapeLog(
            executed_at=datetime.utcnow(),
            duration_millis=total_duration_millis,
            total_users=len(active_users),
            successful_scrapes=successful,
            failed_scrapes=failed,
            total_offers_scraped=total_scraped_offers,
            errors=errors
        )
        db.session.add(scrape_log)
        
        # Clear running flag
        if settings:
            settings.is_scrape_running = False
            settings.scrape_started_at = None
        
        db.session.commit()

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
        # Clear running flag even on error
        try:
            settings = AppSettings.query.first()
            if settings:
                settings.is_scrape_running = False
                settings.scrape_started_at = None
                db.session.commit()
        except:
            pass
        return {
            'total_users': 0,
            'successful_scrapes': 0,
            'failed_scrapes': 0,
            'total_scraped_offers': 0,
            'results': [],
            'error': str(e)
        }
