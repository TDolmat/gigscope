from sqlalchemy import text, Index
from sqlalchemy import func, UniqueConstraint, CheckConstraint
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum
import uuid

from core.config import CONFIG

db = SQLAlchemy()


def uuid4_str():
    return str(uuid.uuid4())


class AppSettings(db.Model):
    __tablename__ = 'app_settings'
    id = db.Column(db.Integer, primary_key=True) # always 1

    # Platform settings
    class EnabledPlatforms(Enum):
        UPWORK = 'upwork'
        FIVERR = 'fiverr'
        USEME = 'useme'
        JUSTJOINIT = 'justjoinit'
        CONTRA = 'contra'
        ROCKETJOBS = 'rocketjobs'

    enabled_platforms = db.Column(db.JSON, default=[])
    
    # Email settings  
    class EmailFrequency(Enum):
        DAILY = 'daily'
        EVERY_2_DAYS = 'every_2_days'
        WEEKLY = 'weekly'
        DISABLED = 'disabled'

    email_frequency = db.Column(db.String, default=EmailFrequency.DAILY.value)
    email_daytime = db.Column(db.String, default='09:00')
    email_max_offers = db.Column(db.Integer, default=CONFIG.DEFAULT_MAX_MAIL_OFFERS)
    
    # Mail provider settings
    mail_api_key = db.Column(db.String, nullable=True)
    mail_sender_email = db.Column(db.String, nullable=True)
    
    # Scraper settings (encrypted)
    apify_api_key = db.Column(db.String, nullable=True)  # Stored encrypted
    upwork_max_offers = db.Column(db.Integer, default=50)  # Max offers to scrape from Upwork
    
    # OpenAI settings for offer scoring
    openai_api_key = db.Column(db.String, nullable=True)  # Stored encrypted
    openai_scoring_prompt = db.Column(db.Text, nullable=True)  # Custom prompt for scoring offers
    
    # Test keywords for quick testing
    test_must_contain = db.Column(db.JSON, default=[])
    test_may_contain = db.Column(db.JSON, default=[])
    test_must_not_contain = db.Column(db.JSON, default=[])
    
    # Running state tracking
    is_scrape_running = db.Column(db.Boolean, default=False)
    scrape_started_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Admins(db.Model):
    # Admins of the platform
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class User(db.Model):
    # User of the platform
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    email = db.Column(db.String, unique=True, nullable=False)
    
    email_preferences_token = db.Column(db.String, unique=True, nullable=False, default=uuid4_str)
    email_unsubscribe_token = db.Column(db.String, unique=True, nullable=False, default=uuid4_str)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class UserEmailPreference(db.Model):
    # User prefered keywords for email offers
    __tablename__ = 'user_email_preferences'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey(User.id), nullable=True)
    
    # KEYWORDS
    must_include_keywords = db.Column(db.JSON, nullable=True)
    can_include_keywords = db.Column(db.JSON, nullable=True)
    cannot_include_keywords = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # enrolled to the newsletter
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # changed keyword preferences
    deleted_at = db.Column(db.DateTime, nullable=True) # resigned from the newsletter


class UserOfferEmail(db.Model):
    # Email sent to the user with matching offers
    __tablename__ = 'user_offer_emails'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey(User.id), nullable=True)
    offer_bundle_id = db.Column(db.Integer, nullable=True) # one to one relationship (without fk constraint, because it can be deleted)

    email_sent_to = db.Column(db.String, nullable=True)
    email_title = db.Column(db.String, nullable=True)
    email_body = db.Column(db.Text, nullable=True)

    scheduled_at = db.Column(db.DateTime, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # enrolled to the newsletter
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # changed keyword preferences

class OfferBundle(db.Model):
    __tablename__ = 'offer_bundles'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(db.Integer, db.ForeignKey(User.id), nullable=True)
    user_offer_email_id = db.Column(db.Integer, nullable=True) # one to one relationship (without fk constraint, because it can be deleted)

    scrape_duration_millis = db.Column(db.Integer, nullable=True) # duration of the scrape in milliseconds

    # KEYWORDS
    must_include_keywords = db.Column(db.JSON, nullable=True)
    can_include_keywords = db.Column(db.JSON, nullable=True)
    cannot_include_keywords = db.Column(db.JSON, nullable=True)

    scraped_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Offer(db.Model):
    # Offer scraped from the platform
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    offer_bundle_id = db.Column(db.Integer, db.ForeignKey(OfferBundle.id), nullable=True)
    
    # Image URL?
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    budget = db.Column(db.String, nullable=True)

    client_name = db.Column(db.String, nullable=True)
    client_location = db.Column(db.String, nullable=True)

    url = db.Column(db.String, nullable=False)
    platform = db.Column(db.String, nullable=False)
    
    # AI scoring (0-10 scale)
    fit_score = db.Column(db.Float, nullable=True)  # How well the offer matches user's keywords/preferences
    attractiveness_score = db.Column(db.Float, nullable=True)  # How attractive the offer is (budget, client quality, etc.)
    overall_score = db.Column(db.Float, nullable=True)  # Combined overall score

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)


class ScrapeLog(db.Model):
    """Log for batch scraping operations"""
    __tablename__ = 'scrape_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Timing
    executed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    duration_millis = db.Column(db.Integer, nullable=True)  # Total scrape duration
    
    # Statistics
    total_users = db.Column(db.Integer, nullable=False, default=0)
    successful_scrapes = db.Column(db.Integer, nullable=False, default=0)
    failed_scrapes = db.Column(db.Integer, nullable=False, default=0)
    total_offers_scraped = db.Column(db.Integer, nullable=False, default=0)
    
    # Errors stored as JSON array: [{"user_id": 1, "email": "...", "error": "..."}]
    errors = db.Column(db.JSON, nullable=True, default=[])
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class MailLog(db.Model):
    """Log for batch email sending operations"""
    __tablename__ = 'mail_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Timing
    executed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Subscribed users stats
    subscribed_total = db.Column(db.Integer, nullable=False, default=0)
    subscribed_sent = db.Column(db.Integer, nullable=False, default=0)
    subscribed_failed = db.Column(db.Integer, nullable=False, default=0)
    subscribed_skipped = db.Column(db.Integer, nullable=False, default=0)
    subscribed_errors = db.Column(db.JSON, nullable=True, default=[])  # [{"email": "...", "error": "..."}]
    
    # Expired subscription users stats
    expired_total = db.Column(db.Integer, nullable=False, default=0)
    expired_sent = db.Column(db.Integer, nullable=False, default=0)
    expired_failed = db.Column(db.Integer, nullable=False, default=0)
    expired_errors = db.Column(db.JSON, nullable=True, default=[])
    
    # Never subscribed users stats
    never_subscribed_total = db.Column(db.Integer, nullable=False, default=0)
    never_subscribed_sent = db.Column(db.Integer, nullable=False, default=0)
    never_subscribed_failed = db.Column(db.Integer, nullable=False, default=0)
    never_subscribed_errors = db.Column(db.JSON, nullable=True, default=[])
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

