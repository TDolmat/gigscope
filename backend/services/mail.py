import resend
import time
from datetime import datetime
from typing import List, Optional, Tuple
from core.models import db, AppSettings, UserOfferEmail, Offer, OfferBundle, MailLog
from core.config import CONFIG
from services.mail_templates import (
    generate_offers_email,
    generate_no_offers_email,
    generate_expired_subscription_email,
    generate_not_subscribed_email,
    generate_test_email
)

# Rate limit delay between emails (seconds) - Resend allows 2 req/sec
EMAIL_SEND_DELAY = 0.6


class MailService:
    """Service for sending emails via Resend."""
    
    def __init__(self, api_key: str, sender_email: str):
        self.api_key = api_key
        self.sender_email = sender_email
        resend.api_key = api_key
    
    @classmethod
    def from_settings(cls) -> Optional['MailService']:
        """Create MailService instance from AppSettings."""
        settings = AppSettings.query.first()
        if not settings or not settings.mail_api_key or not settings.mail_sender_email:
            return None
        return cls(settings.mail_api_key, settings.mail_sender_email)
    
    def send_email(self, to: str, subject: str, html: str) -> dict:
        """Send an email."""
        try:
            params = {
                "from": self.sender_email,
                "to": [to],
                "subject": subject,
                "html": html,
            }
            response = resend.Emails.send(params)
            return {"success": True, "id": response.get("id")}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_offers_email(
        self, 
        user_id: int, 
        user_email: str, 
        offers: List[Offer], 
        preferences_token: str, 
        unsubscribe_token: str, 
        base_url: str = CONFIG.BASE_URL
    ) -> Tuple[dict, Optional[UserOfferEmail]]:
        """
        Send email with job offers to subscribed user.
        Returns tuple of (result, email_log) - email_log is NOT committed to DB.
        """
        preferences_url = f"{base_url}/email-preferences/{preferences_token}"
        unsubscribe_url = f"{base_url}/unsubscribe/{unsubscribe_token}"
        
        if len(offers) == 0:
            subject = "AI Scoper - Brak nowych ofert na dzisiaj"
            html = generate_no_offers_email(
                preferences_url=preferences_url,
                unsubscribe_url=unsubscribe_url
            )
        else:
            subject = f"AI Scoper - {len(offers)} nowych ofert dla Ciebie!"
            html = generate_offers_email(
                offers=offers,
                preferences_url=preferences_url,
                unsubscribe_url=unsubscribe_url
            )
        
        result = self.send_email(to=user_email, subject=subject, html=html)

        email_log = None
        if result.get("success"):
            # Get bundle_id from first offer if exists
            bundle_id = offers[0].offer_bundle_id if offers else None
            
            email_log = UserOfferEmail(
                user_id=user_id,
                offer_bundle_id=bundle_id,
                email_sent_to=user_email,
                email_title=subject,
                email_body=html,
                sent_at=datetime.utcnow()
            )
        
        return result, email_log
    
    def send_not_subscribed_email(
        self, 
        user_id: int, 
        user_email: str, 
        offers_count: int, 
        is_expired: bool, 
        preferences_token: str, 
        unsubscribe_token: str, 
        circle_url: str = CONFIG.CIRCLE_URL, 
        base_url: str = CONFIG.BASE_URL
    ) -> Tuple[dict, Optional[UserOfferEmail]]:
        """
        Send email for non-subscribed users.
        Returns tuple of (result, email_log) - email_log is NOT committed to DB.
        """
        preferences_url = f"{base_url}/email-preferences/{preferences_token}"
        unsubscribe_url = f"{base_url}/unsubscribe/{unsubscribe_token}"
        
        if is_expired:
            subject = f"Twoja subskrypcja wygasła - {offers_count} ofert czeka!"
        else:
            subject = f"{offers_count} ofert czeka na Ciebie!"
        
        html = generate_not_subscribed_email(
            offers_count=offers_count,
            is_expired=is_expired,
            circle_url=circle_url,
            preferences_url=preferences_url,
            unsubscribe_url=unsubscribe_url
        )
        
        result = self.send_email(to=user_email, subject=subject, html=html)
        
        email_log = None
        if result.get("success"):
            # No bundle_id for promotional emails
            email_log = UserOfferEmail(
                user_id=user_id,
                offer_bundle_id=None,
                email_sent_to=user_email,
                email_title=subject,
                email_body=html,
                sent_at=datetime.utcnow()
            )
        
        return result, email_log
    
    def send_expired_subscription_email(
        self,
        user_id: int,
        user_email: str,
        preferences_token: str,
        unsubscribe_token: str,
        circle_url: str = CONFIG.CIRCLE_URL,
        base_url: str = CONFIG.BASE_URL
    ) -> Tuple[dict, Optional[UserOfferEmail]]:
        """
        Send reminder email for users with expired subscription.
        These users don't have scraped offers, so we just remind them to renew.
        Returns tuple of (result, email_log) - email_log is NOT committed to DB.
        """
        preferences_url = f"{base_url}/email-preferences/{preferences_token}"
        unsubscribe_url = f"{base_url}/unsubscribe/{unsubscribe_token}"
        
        subject = "Twoja subskrypcja AI Scoper wygasła - odnów ją!"
        html = generate_expired_subscription_email(
            circle_url=circle_url,
            preferences_url=preferences_url,
            unsubscribe_url=unsubscribe_url
        )
        
        result = self.send_email(to=user_email, subject=subject, html=html)
        
        email_log = None
        if result.get("success"):
            email_log = UserOfferEmail(
                user_id=user_id,
                offer_bundle_id=None,  # No bundle for expired users
                email_sent_to=user_email,
                email_title=subject,
                email_body=html,
                sent_at=datetime.utcnow()
            )
        
        return result, email_log
    
    def send_test_email(self, to: str) -> dict:
        """Send a test email to verify configuration."""
        subject = "AI Scoper - Test połączenia z bramką mailową"
        html = generate_test_email()
        return self.send_email(to=to, subject=subject, html=html)


# ==================== Main Function ====================

def send_user_offer_emails(base_url: str = CONFIG.BASE_URL, circle_url: str = CONFIG.CIRCLE_URL) -> dict:
    """
    Send periodic offer emails to all users based on their subscription status.
    Email frequency is configured in AppSettings (daily, every 2 days, weekly, etc.)
    
    Flow:
    1. Query all subscribed users with their data (before loop)
    2. Query users who never subscribed (before loop)
    3. Query users with expired subscriptions (before loop)
    4. Send emails in loops
    5. Bulk save all email logs at the end
    """
    from helpers.user_helper import (
        get_subscribed_users_with_data,
        get_users_never_subscribed_with_data,
        get_users_expired_subscription_with_data
    )
    
    # Initialize mail service
    mail_service = MailService.from_settings()
    if not mail_service:
        return {
            "success": False,
            "error": "Mail service not configured. Please set mail_api_key and mail_sender_email in settings."
        }
    
    app_settings = AppSettings.query.first()
    max_offers = app_settings.email_max_offers if app_settings else CONFIG.DEFAULT_MAX_MAIL_OFFERS
    
    # Results tracking
    results = {
        "subscribed": {"sent": 0, "failed": 0, "skipped": 0, "details": []},
        "never_subscribed": {"sent": 0, "failed": 0, "details": []},
        "expired": {"sent": 0, "failed": 0, "details": []},
    }
    
    # Collect all email logs to save at the end
    # Each item is a tuple: (email_log, bundle_id) - bundle_id can be None for promotional emails
    email_logs_with_bundles: List[tuple] = []
    
    # ==================== 1. Subscribed Users ====================
    subscribed_users = get_subscribed_users_with_data(max_offers=max_offers)
    
    for user_data in subscribed_users:
        try:
            bundle_id = user_data.get("bundle_id")
            
            if not user_data["offers"] or not bundle_id:
                # User has no bundle/offers yet - skip
                results["subscribed"]["skipped"] += 1
                results["subscribed"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "skipped",
                    "reason": "No unsent offers available"
                })
                continue
            
            result, email_log = mail_service.send_offers_email(
                user_id=user_data["user_id"],
                user_email=user_data["email"],
                offers=user_data["offers"],
                preferences_token=user_data["preferences_token"],
                unsubscribe_token=user_data["unsubscribe_token"],
                base_url=base_url
            )
            
            if result.get("success"):
                results["subscribed"]["sent"] += 1
                results["subscribed"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "sent",
                    "offers_count": len(user_data["offers"])
                })
                if email_log:
                    email_logs_with_bundles.append((email_log, bundle_id))
            else:
                results["subscribed"]["failed"] += 1
                results["subscribed"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "failed",
                    "error": result.get("error")
                })
            
            # Rate limit delay
            time.sleep(EMAIL_SEND_DELAY)
                
        except Exception as e:
            results["subscribed"]["failed"] += 1
            results["subscribed"]["details"].append({
                "user_id": user_data["user_id"],
                "email": user_data["email"],
                "status": "failed",
                "error": str(e)
            })
    
    # ==================== 2. Never Subscribed Users ====================
    # These users don't have bundles - we just tell them how many offers they could get
    never_subscribed_users = get_users_never_subscribed_with_data()
    
    for user_data in never_subscribed_users:
        try:
            result, email_log = mail_service.send_not_subscribed_email(
                user_id=user_data["user_id"],
                user_email=user_data["email"],
                offers_count=max_offers,  # Show max_offers as potential count
                is_expired=False,  # Never subscribed
                preferences_token=user_data["preferences_token"],
                unsubscribe_token=user_data["unsubscribe_token"],
                circle_url=circle_url,
                base_url=base_url
            )
            
            if result.get("success"):
                results["never_subscribed"]["sent"] += 1
                results["never_subscribed"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "sent",
                    "offers_count": max_offers
                })
                if email_log:
                    # No bundle for never_subscribed users
                    email_logs_with_bundles.append((email_log, None))
            else:
                results["never_subscribed"]["failed"] += 1
                results["never_subscribed"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "failed",
                    "error": result.get("error")
                })
            
            # Rate limit delay
            time.sleep(EMAIL_SEND_DELAY)
                
        except Exception as e:
            results["never_subscribed"]["failed"] += 1
            results["never_subscribed"]["details"].append({
                "user_id": user_data["user_id"],
                "email": user_data["email"],
                "status": "failed",
                "error": str(e)
            })
    
    # ==================== 3. Expired Subscription Users ====================
    # Note: Expired users don't have scraped offers, we just send them a reminder
    expired_users = get_users_expired_subscription_with_data()
    
    for user_data in expired_users:
        try:
            result, email_log = mail_service.send_expired_subscription_email(
                user_id=user_data["user_id"],
                user_email=user_data["email"],
                preferences_token=user_data["preferences_token"],
                unsubscribe_token=user_data["unsubscribe_token"],
                circle_url=circle_url,
                base_url=base_url
            )
            
            if result.get("success"):
                results["expired"]["sent"] += 1
                results["expired"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "sent"
                })
                if email_log:
                    # Expired users don't have bundles, so bundle_id is None
                    email_logs_with_bundles.append((email_log, None))
            else:
                results["expired"]["failed"] += 1
                results["expired"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "failed",
                    "error": result.get("error")
                })
            
            # Rate limit delay
            time.sleep(EMAIL_SEND_DELAY)
                
        except Exception as e:
            results["expired"]["failed"] += 1
            results["expired"]["details"].append({
                "user_id": user_data["user_id"],
                "email": user_data["email"],
                "status": "failed",
                "error": str(e)
            })
    
    # ==================== 4. Bulk Save Email Logs & Update Bundles ====================
    if email_logs_with_bundles:
        try:
            # First, add all email logs to session
            email_logs = [item[0] for item in email_logs_with_bundles]
            db.session.add_all(email_logs)
            db.session.flush()  # Flush to get IDs assigned to email logs
            
            # Now update the bundles with the email IDs
            bundle_ids_to_update = []
            for email_log, bundle_id in email_logs_with_bundles:
                if bundle_id is not None:
                    bundle_ids_to_update.append((bundle_id, email_log.id))
            
            # Bulk update bundles
            if bundle_ids_to_update:
                for bundle_id, email_id in bundle_ids_to_update:
                    OfferBundle.query.filter(
                        OfferBundle.id == bundle_id
                    ).update({
                        OfferBundle.user_offer_email_id: email_id
                    })
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {
                "success": False,
                "error": f"Failed to save email logs: {str(e)}",
                "results": results
            }
    
    # ==================== 5. Build Summary ====================
    total_sent = (
        results["subscribed"]["sent"] + 
        results["never_subscribed"]["sent"] + 
        results["expired"]["sent"]
    )
    total_failed = (
        results["subscribed"]["failed"] + 
        results["never_subscribed"]["failed"] + 
        results["expired"]["failed"]
    )
    
    # ==================== 6. Save MailLog ====================
    # Collect errors for each category
    subscribed_errors = [
        {'email': d['email'], 'error': d.get('error', '')}
        for d in results["subscribed"]["details"] if d.get('status') == 'failed'
    ]
    expired_errors = [
        {'email': d['email'], 'error': d.get('error', '')}
        for d in results["expired"]["details"] if d.get('status') == 'failed'
    ]
    never_subscribed_errors = [
        {'email': d['email'], 'error': d.get('error', '')}
        for d in results["never_subscribed"]["details"] if d.get('status') == 'failed'
    ]
    
    try:
        mail_log = MailLog(
            executed_at=datetime.utcnow(),
            # Subscribed users
            subscribed_total=len(subscribed_users),
            subscribed_sent=results["subscribed"]["sent"],
            subscribed_failed=results["subscribed"]["failed"],
            subscribed_skipped=results["subscribed"]["skipped"],
            subscribed_errors=subscribed_errors,
            # Expired users
            expired_total=len(expired_users),
            expired_sent=results["expired"]["sent"],
            expired_failed=results["expired"]["failed"],
            expired_errors=expired_errors,
            # Never subscribed users
            never_subscribed_total=len(never_subscribed_users),
            never_subscribed_sent=results["never_subscribed"]["sent"],
            never_subscribed_failed=results["never_subscribed"]["failed"],
            never_subscribed_errors=never_subscribed_errors,
        )
        db.session.add(mail_log)
        db.session.commit()
    except Exception as e:
        # Log saving failed, but don't fail the whole operation
        print(f"Warning: Failed to save MailLog: {str(e)}")
    
    return {
        "success": total_failed == 0,
        "summary": {
            "total_sent": total_sent,
            "total_failed": total_failed,
            "subscribed_users": len(subscribed_users),
            "never_subscribed_users": len(never_subscribed_users),
            "expired_users": len(expired_users)
        },
        "results": results
    }
