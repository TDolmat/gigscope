from datetime import datetime
from typing import List
from sqlalchemy import func, and_
from core.models import (
    db, User, UserSubscription, UserEmailPreference, 
    UserOfferEmail, Offer, OfferBundle
)
from core.config import CONFIG


def is_user_subscribed(user_id: int) -> bool:
    """Check if user has active subscription and email preferences."""
    user = User.query.filter(User.id == user_id).first()

    if not user:
        return False
    
    user_subscription = UserSubscription.query.filter(
        UserSubscription.email == user.email,
        UserSubscription.expires_at > datetime.utcnow()
    ).first()

    if not user_subscription:
        return False

    user_email_preference = UserEmailPreference.query.filter(
        UserEmailPreference.user_id == user_id,
        UserEmailPreference.deleted_at.is_(None)
    ).order_by(
        UserEmailPreference.created_at.desc()
    ).first()

    if not user_email_preference:
        return False

    return True


def get_subscribed_users_with_data(max_offers: int = CONFIG.DEFAULT_MAX_MAIL_OFFERS) -> List[dict]:
    """
    Get all users with active subscription and email preferences,
    along with their latest unsent offers.
    
    Only returns bundles that haven't been used to create emails yet
    (user_offer_email_id is NULL).
    
    Returns list of dicts with keys:
        - user_id, email, preferences_token, unsubscribe_token, bundle_id, offers
    """
    # Step 1: Get all subscribed users with active preferences in one query
    subscribed_users = db.session.query(
        User.id,
        User.email,
        User.email_preferences_token,
        User.email_unsubscribe_token
    ).join(
        UserSubscription,
        UserSubscription.email == User.email
    ).join(
        UserEmailPreference,
        UserEmailPreference.user_id == User.id
    ).filter(
        UserSubscription.expires_at > datetime.utcnow(),
        UserEmailPreference.deleted_at.is_(None)
    ).distinct(User.id).all()
    
    if not subscribed_users:
        return []
    
    user_ids = [u.id for u in subscribed_users]
    
    # Step 2: Get latest UNSENT bundle for each user (only bundles without user_offer_email_id)
    latest_bundle_subq = db.session.query(
        OfferBundle.user_id,
        func.max(OfferBundle.scraped_at).label('max_scraped_at')
    ).filter(
        OfferBundle.user_id.in_(user_ids),
        OfferBundle.user_offer_email_id.is_(None)  # Only unsent bundles
    ).group_by(OfferBundle.user_id).subquery()
    
    # Step 3: Get bundle IDs
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
    
    # Step 4: Get all offers for these bundles in one query
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
    
    # Step 5: Build result
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


def get_users_never_subscribed_with_data() -> List[dict]:
    """
    Get users who have email preferences but NEVER had a Circle subscription.
    Also checks if a promotional email was already sent to them (to avoid spam).
    
    Note: These users don't have scraped offers (no bundles), we just send them
    a promotional email encouraging them to subscribe.
    
    Returns list of dicts with keys:
        - user_id, email, preferences_token, unsubscribe_token
    """
    # Users with preferences who never had any subscription
    users_with_preferences = db.session.query(
        User.id,
        User.email,
        User.email_preferences_token,
        User.email_unsubscribe_token
    ).join(
        UserEmailPreference,
        UserEmailPreference.user_id == User.id
    ).outerjoin(
        UserSubscription,
        UserSubscription.email == User.email
    ).filter(
        UserEmailPreference.deleted_at.is_(None),
        UserSubscription.id.is_(None)  # Never had subscription
    ).distinct(User.id).all()
    
    if not users_with_preferences:
        return []
    
    user_ids = [u.id for u in users_with_preferences]
    
    # Check who already received a promotional email (to avoid spam)
    # We consider "not subscribed" emails as those without offer_bundle_id
    users_already_emailed = db.session.query(
        UserOfferEmail.user_id
    ).filter(
        UserOfferEmail.user_id.in_(user_ids),
        UserOfferEmail.offer_bundle_id.is_(None),  # Promotional emails don't have bundle
        UserOfferEmail.sent_at.isnot(None)
    ).distinct().all()
    
    already_emailed_ids = {u.user_id for u in users_already_emailed}
    
    # Filter out users who already received promotional email
    users_to_email = [u for u in users_with_preferences if u.id not in already_emailed_ids]
    
    if not users_to_email:
        return []
    
    # No bundles for these users - they don't have scraped offers
    result = []
    for user in users_to_email:
        result.append({
            "user_id": user.id,
            "email": user.email,
            "preferences_token": user.email_preferences_token,
            "unsubscribe_token": user.email_unsubscribe_token
        })
    
    return result


def get_users_expired_subscription_with_data() -> List[dict]:
    """
    Get users who HAD a Circle subscription but it expired.
    Also checks if a reminder email was already sent after expiration.
    
    Note: These users don't have scraped offers (scraping stops when subscription expires),
    so we only return user data for sending reminder emails.
    
    Returns list of dicts with keys:
        - user_id, email, preferences_token, unsubscribe_token
    """
    now = datetime.utcnow()
    
    # Subquery to find users with expired subscriptions (had subscription, now expired)
    # We need users who: 
    # 1. Have email preferences (active)
    # 2. Had at least one subscription (not never subscribed)
    # 3. Don't have any active subscription (all expired)
    
    # Find users with any subscription history
    users_with_any_subscription = db.session.query(
        UserSubscription.email
    ).distinct().subquery()
    
    # Find users with ACTIVE subscription
    users_with_active_subscription = db.session.query(
        UserSubscription.email
    ).filter(
        UserSubscription.expires_at > now
    ).distinct().subquery()
    
    # Users with expired subscription = had subscription but not active now
    expired_users = db.session.query(
        User.id,
        User.email,
        User.email_preferences_token,
        User.email_unsubscribe_token
    ).join(
        UserEmailPreference,
        UserEmailPreference.user_id == User.id
    ).filter(
        UserEmailPreference.deleted_at.is_(None),
        User.email.in_(db.session.query(users_with_any_subscription.c.email)),
        ~User.email.in_(db.session.query(users_with_active_subscription.c.email))
    ).distinct(User.id).all()
    
    if not expired_users:
        return []
    
    user_emails = [u.email for u in expired_users]
    
    # Get expiration dates for each user (latest subscription)
    expiration_dates = db.session.query(
        UserSubscription.email,
        func.max(UserSubscription.expires_at).label('expired_at')
    ).filter(
        UserSubscription.email.in_(user_emails)
    ).group_by(UserSubscription.email).all()
    
    expiration_by_email = {e.email: e.expired_at for e in expiration_dates}
    
    # Check if reminder email was already sent AFTER subscription expired
    users_with_reminder = set()
    for user in expired_users:
        expired_at = expiration_by_email.get(user.email)
        if expired_at:
            reminder_sent = UserOfferEmail.query.filter(
                UserOfferEmail.user_id == user.id,
                UserOfferEmail.offer_bundle_id.is_(None),  # Promotional/reminder emails
                UserOfferEmail.sent_at > expired_at  # Sent after expiration
            ).first()
            if reminder_sent:
                users_with_reminder.add(user.id)
    
    # Filter out users who already got reminder
    users_to_email = [u for u in expired_users if u.id not in users_with_reminder]
    
    if not users_to_email:
        return []
    
    # No offers for expired users - they don't have scraped bundles
    result = []
    for user in users_to_email:
        result.append({
            "user_id": user.id,
            "email": user.email,
            "preferences_token": user.email_preferences_token,
            "unsubscribe_token": user.email_unsubscribe_token
        })
    
    return result


def get_active_subscribed_users():
    active_subscribed_users_info = UserSubscription.query.join(
        User, 
        User.email == UserSubscription.email
    ).join(
        UserEmailPreference, 
        UserEmailPreference.user_id == User.id
    ).filter(
        UserSubscription.expires_at > datetime.utcnow(),
        UserEmailPreference.deleted_at.is_(None)
    ).distinct(
        User.id
    ).with_entities(
        User.id,
        User.email,
        UserEmailPreference.must_include_keywords,
        UserEmailPreference.can_include_keywords,
        UserEmailPreference.cannot_include_keywords
    ).all()

    return active_subscribed_users_info
