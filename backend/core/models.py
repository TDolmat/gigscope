from sqlalchemy import text, Index
from sqlalchemy import func, UniqueConstraint, CheckConstraint
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum
import uuid

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
    email_max_offers = db.Column(db.Integer, default=15)
    
    # Mail provider settings
    mail_api_key = db.Column(db.String, nullable=True)
    mail_sender_email = db.Column(db.String, nullable=True)
    
    # Scraper settings (encrypted)
    apify_api_key = db.Column(db.String, nullable=True)  # Stored encrypted
    
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


class UserSubscription(db.Model):
    # Subscription to the circle community
    __tablename__ = 'user_subscriptions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    email = db.Column(db.String, nullable=False)
    subscribed_at = db.Column(db.DateTime, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

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

    # KEYWORDS
    must_include_keywords = db.Column(db.JSON, nullable=True)
    can_include_keywords = db.Column(db.JSON, nullable=True)
    cannot_include_keywords = db.Column(db.JSON, nullable=True)

    email_sent_to = db.Column(db.String, nullable=True)
    email_title = db.Column(db.String, nullable=True)
    email_body = db.Column(db.Text, nullable=True)

    scheduled_at = db.Column(db.DateTime, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # enrolled to the newsletter
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # changed keyword preferences


class Offer(db.Model):
    # Offer scraped from the platform
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_offer_email_id = db.Column(db.Integer, db.ForeignKey(UserOfferEmail.id), nullable=True)
    
    # Image URL?
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    budget = db.Column(db.String, nullable=True)
    client_name = db.Column(db.String, nullable=True)

    including_keyword = db.Column(db.String, nullable=True)

    url = db.Column(db.String, nullable=False)
    platform = db.Column(db.String, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

