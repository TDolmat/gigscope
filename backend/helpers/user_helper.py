from datetime import datetime
from core.models import db, User, UserSubscription, UserEmailPreference


def is_user_subscribed(user_id: int) -> bool:

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