import resend
import time
from datetime import datetime
from typing import List, Optional, Tuple
from core.models import db, AppSettings, UserOfferEmail, Offer, OfferBundle, MailLog
from core.config import CONFIG
from services.mail_templates import (
    generate_offers_email,
    generate_no_offers_email,
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
    
    def send_promo_email(
        self,
        user_id: int,
        user_email: str,
        offers_count: int,
        preferences_token: str,
        unsubscribe_token: str,
        circle_url: str = CONFIG.CIRCLE_URL,
        base_url: str = CONFIG.BASE_URL
    ) -> Tuple[dict, Optional[UserOfferEmail]]:
        """
        Send promotional email to users who are not BeFreeClub subscribers.
        This email is sent only ONCE per user.
        Returns tuple of (result, email_log) - email_log is NOT committed to DB.
        """
        preferences_url = f"{base_url}/email-preferences/{preferences_token}"
        unsubscribe_url = f"{base_url}/unsubscribe/{unsubscribe_token}"
        
        subject = f"AI Scoper - {offers_count} ofert czeka na Ciebie!"
        html = generate_not_subscribed_email(
            offers_count=offers_count,
            is_expired=False,  # We don't track expired status anymore
            circle_url=circle_url,
            preferences_url=preferences_url,
            unsubscribe_url=unsubscribe_url
        )
        
        result = self.send_email(to=user_email, subject=subject, html=html)
        
        email_log = None
        if result.get("success"):
            # Promotional email - no bundle_id (this is how we track it was sent)
            email_log = UserOfferEmail(
                user_id=user_id,
                offer_bundle_id=None,  # NULL = promotional email
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
    Send offer emails to all users with active BeFreeClub subscription.
    Also sends ONE promotional email to users who have preferences but are not subscribers.
    Fetches subscriber list from BeFreeClub API.
    
    Flow:
    1. Query all subscribed users with their data (fetches from BeFreeClub API)
    2. Query non-subscribed users who haven't received promo email yet
    3. Send emails in loops
    4. Bulk save all email logs at the end
    """
    from helpers.user_helper import get_subscribed_users_with_data, get_non_subscribed_users_for_promo
    
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
        "non_subscribed": {"sent": 0, "failed": 0, "details": []},
    }
    
    # Collect all email logs to save at the end
    # Each item is a tuple: (email_log, bundle_id)
    email_logs_with_bundles: List[tuple] = []
    
    # ==================== Subscribed Users ====================
    # This function fetches the subscriber list from BeFreeClub API
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
    
    # ==================== Non-Subscribed Users (Promo Email - Once Only) ====================
    non_subscribed_users = get_non_subscribed_users_for_promo()
    
    for user_data in non_subscribed_users:
        try:
            result, email_log = mail_service.send_promo_email(
                user_id=user_data["user_id"],
                user_email=user_data["email"],
                offers_count=max_offers,  # Show max_offers as potential count
                preferences_token=user_data["preferences_token"],
                unsubscribe_token=user_data["unsubscribe_token"],
                circle_url=circle_url,
                base_url=base_url
            )
            
            if result.get("success"):
                results["non_subscribed"]["sent"] += 1
                results["non_subscribed"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "sent"
                })
                if email_log:
                    # Promo emails have no bundle
                    email_logs_with_bundles.append((email_log, None))
            else:
                results["non_subscribed"]["failed"] += 1
                results["non_subscribed"]["details"].append({
                    "user_id": user_data["user_id"],
                    "email": user_data["email"],
                    "status": "failed",
                    "error": result.get("error")
                })
            
            # Rate limit delay
            time.sleep(EMAIL_SEND_DELAY)
                
        except Exception as e:
            results["non_subscribed"]["failed"] += 1
            results["non_subscribed"]["details"].append({
                "user_id": user_data["user_id"],
                "email": user_data["email"],
                "status": "failed",
                "error": str(e)
            })
    
    # ==================== Bulk Save Email Logs & Update Bundles ====================
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
    
    # ==================== Build Summary ====================
    total_sent = results["subscribed"]["sent"] + results["non_subscribed"]["sent"]
    total_failed = results["subscribed"]["failed"] + results["non_subscribed"]["failed"]
    
    # ==================== Save MailLog ====================
    # Collect errors
    subscribed_errors = [
        {'email': d['email'], 'error': d.get('error', '')}
        for d in results["subscribed"]["details"] if d.get('status') == 'failed'
    ]
    non_subscribed_errors = [
        {'email': d['email'], 'error': d.get('error', '')}
        for d in results["non_subscribed"]["details"] if d.get('status') == 'failed'
    ]
    
    try:
        mail_log = MailLog(
            executed_at=datetime.utcnow(),
            # Subscribed users (BeFreeClub members)
            subscribed_total=len(subscribed_users),
            subscribed_sent=results["subscribed"]["sent"],
            subscribed_failed=results["subscribed"]["failed"],
            subscribed_skipped=results["subscribed"]["skipped"],
            subscribed_errors=subscribed_errors,
            # Non-subscribed users (promo emails) - using never_subscribed fields
            never_subscribed_total=len(non_subscribed_users),
            never_subscribed_sent=results["non_subscribed"]["sent"],
            never_subscribed_failed=results["non_subscribed"]["failed"],
            never_subscribed_errors=non_subscribed_errors,
            # Expired no longer tracked separately
            expired_total=0,
            expired_sent=0,
            expired_failed=0,
            expired_errors=[],
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
            "non_subscribed_users": len(non_subscribed_users)
        },
        "results": results
    }
