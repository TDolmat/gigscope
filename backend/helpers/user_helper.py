import requests
from typing import List, Set, Optional
from datetime import datetime
from core.models import db, User, UserEmailPreference, UserOfferEmail, Offer, OfferBundle
from core.config import CONFIG

# Cache for subscriber emails to avoid repeated API calls within the same operation
_subscribers_cache: Optional[Set[str]] = None


def fetch_subscribers_from_api() -> Set[str]:
    """
    Fetch list of subscribed emails from BeFreeClub API.
    Returns a set of lowercase email addresses.
    """
    global _subscribers_cache
    
    if not CONFIG.BEFREECLUB_API_KEY:
        print("Warning: BEFREECLUB_API_KEY not configured")
        return set()
    
    try:
        response = requests.get(
            f"https://api.befreeclub.pro/subscribers?key={CONFIG.BEFREECLUB_API_KEY}",
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        emails = data.get('emails', [])
        # Normalize emails to lowercase for case-insensitive comparison
        _subscribers_cache = {email.lower() for email in emails}
        return _subscribers_cache
        
    except requests.RequestException as e:
        print(f"Error fetching subscribers from API: {str(e)}")
        return set()


def get_subscribers() -> Set[str]:
    """
    Get cached subscribers or fetch from API if not cached.
    Call clear_subscribers_cache() to force a refresh.
    """
    global _subscribers_cache
    if _subscribers_cache is None:
        return fetch_subscribers_from_api()
    return _subscribers_cache


def clear_subscribers_cache():
    """Clear the subscribers cache to force a fresh fetch."""
    global _subscribers_cache
    _subscribers_cache = None


def is_email_subscribed(email: str) -> bool:
    """Check if an email is in the BeFreeClub subscribers list."""
    subscribers = get_subscribers()
    return email.lower() in subscribers


def is_user_subscribed(user_id: int) -> bool:
    """
    Check if user has active subscription (email in BeFreeClub list) 
    and has email preferences.
    """
    user = User.query.filter(User.id == user_id).first()
    if not user:
        return False
    
    # Check if email is in subscribers list
    if not is_email_subscribed(user.email):
        return False
    
    # Check if user has active email preferences
    user_email_preference = UserEmailPreference.query.filter(
        UserEmailPreference.user_id == user_id,
        UserEmailPreference.deleted_at.is_(None)
    ).order_by(
        UserEmailPreference.created_at.desc()
    ).first()
    
    return user_email_preference is not None


def get_active_subscribed_users() -> List[tuple]:
    """
    Get all users with active BeFreeClub subscription and email preferences.
    Returns list of tuples: (user_id, email, must_include, can_include, cannot_include)
    """
    # Refresh subscribers list from API
    clear_subscribers_cache()
    subscribers = get_subscribers()
    
    if not subscribers:
        return []
    
    # Get all users with active preferences whose email is in subscribers list
    users_with_preferences = db.session.query(
        User.id,
        User.email,
        UserEmailPreference.must_include_keywords,
        UserEmailPreference.can_include_keywords,
        UserEmailPreference.cannot_include_keywords
    ).join(
        UserEmailPreference,
        UserEmailPreference.user_id == User.id
    ).filter(
        UserEmailPreference.deleted_at.is_(None)
    ).distinct(User.id).all()
    
    # Filter to only include users whose email is in subscribers list
    active_users = [
        (u.id, u.email, u.must_include_keywords, u.can_include_keywords, u.cannot_include_keywords)
        for u in users_with_preferences
        if u.email.lower() in subscribers
    ]
    
    return active_users


def get_non_subscribed_users_for_promo() -> List[dict]:
    """
    Get users who have email preferences but are NOT in BeFreeClub subscribers list
    AND have not yet received a promotional email.
    
    Promotional emails are identified by having offer_bundle_id = NULL in UserOfferEmail.
    
    Returns list of dicts with keys:
        - user_id, email, preferences_token, unsubscribe_token
    """
    # Get current subscribers from API (uses cache if available)
    subscribers = get_subscribers()
    
    # Get all users with active preferences
    users_with_preferences = db.session.query(
        User.id,
        User.email,
        User.email_preferences_token,
        User.email_unsubscribe_token
    ).join(
        UserEmailPreference,
        UserEmailPreference.user_id == User.id
    ).filter(
        UserEmailPreference.deleted_at.is_(None)
    ).distinct(User.id).all()
    
    # Filter to only users NOT in subscribers list
    non_subscribed_users = [u for u in users_with_preferences if u.email.lower() not in subscribers]
    
    if not non_subscribed_users:
        return []
    
    user_ids = [u.id for u in non_subscribed_users]
    
    # Check who already received a promotional email (offer_bundle_id IS NULL = promotional)
    users_already_emailed = db.session.query(
        UserOfferEmail.user_id
    ).filter(
        UserOfferEmail.user_id.in_(user_ids),
        UserOfferEmail.offer_bundle_id.is_(None),  # Promotional emails have no bundle
        UserOfferEmail.sent_at.isnot(None)
    ).distinct().all()
    
    already_emailed_ids = {u.user_id for u in users_already_emailed}
    
    # Filter out users who already received promotional email
    users_to_email = [u for u in non_subscribed_users if u.id not in already_emailed_ids]
    
    result = []
    for user in users_to_email:
        result.append({
            "user_id": user.id,
            "email": user.email,
            "preferences_token": user.email_preferences_token,
            "unsubscribe_token": user.email_unsubscribe_token
        })
    
    return result


def get_subscribed_users_with_data(max_offers: int = CONFIG.DEFAULT_MAX_MAIL_OFFERS) -> List[dict]:
    """
    Get all users with active BeFreeClub subscription and email preferences,
    along with their latest unsent offers.
    
    Only returns bundles that haven't been used to create emails yet
    (user_offer_email_id is NULL).
    
    Returns list of dicts with keys:
        - user_id, email, preferences_token, unsubscribe_token, bundle_id, offers
    """
    from sqlalchemy import func, and_
    
    # Refresh subscribers list from API
    clear_subscribers_cache()
    subscribers = get_subscribers()
    
    if not subscribers:
        return []
    
    # Get all users with active preferences
    users_with_preferences = db.session.query(
        User.id,
        User.email,
        User.email_preferences_token,
        User.email_unsubscribe_token
    ).join(
        UserEmailPreference,
        UserEmailPreference.user_id == User.id
    ).filter(
        UserEmailPreference.deleted_at.is_(None)
    ).distinct(User.id).all()
    
    # Filter to only include users whose email is in subscribers list
    subscribed_users = [u for u in users_with_preferences if u.email.lower() in subscribers]
    
    if not subscribed_users:
        return []
    
    user_ids = [u.id for u in subscribed_users]
    
    # Get latest UNSENT bundle for each user (only bundles without user_offer_email_id)
    latest_bundle_subq = db.session.query(
        OfferBundle.user_id,
        func.max(OfferBundle.scraped_at).label('max_scraped_at')
    ).filter(
        OfferBundle.user_id.in_(user_ids),
        OfferBundle.user_offer_email_id.is_(None)  # Only unsent bundles
    ).group_by(OfferBundle.user_id).subquery()
    
    # Get bundle IDs
    latest_bundles = db.session.query(
        OfferBundle.id,
        OfferBundle.user_id
    ).join(
        latest_bundle_subq,
        and_(
            OfferBundle.user_id == latest_bundle_subq.c.user_id,
            OfferBundle.scraped_at == latest_bundle_subq.c.max_scraped_at
        )
    ).all()
    
    bundle_by_user = {b.user_id: b.id for b in latest_bundles}
    bundle_ids = [b.id for b in latest_bundles]
    
    # Get all offers for these bundles in one query
    all_offers = Offer.query.filter(
        Offer.offer_bundle_id.in_(bundle_ids),
        Offer.deleted_at.is_(None)
    ).all() if bundle_ids else []
    
    # Group offers by bundle
    offers_by_bundle = {}
    for offer in all_offers:
        if offer.offer_bundle_id not in offers_by_bundle:
            offers_by_bundle[offer.offer_bundle_id] = []
        offers_by_bundle[offer.offer_bundle_id].append(offer)
    
    # Build result
    result = []
    for user in subscribed_users:
        bundle_id = bundle_by_user.get(user.id)
        offers = offers_by_bundle.get(bundle_id, [])[:max_offers] if bundle_id else []
        
        result.append({
            "user_id": user.id,
            "email": user.email,
            "preferences_token": user.email_preferences_token,
            "unsubscribe_token": user.email_unsubscribe_token,
            "bundle_id": bundle_id,
            "offers": offers
        })
    
    return result
