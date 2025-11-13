from sqlalchemy import text, Index
from sqlalchemy import func, UniqueConstraint, CheckConstraint
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum

db = SQLAlchemy()


class Config(db.Model):
    __tablename__ = 'configs'

    class ConfigKey(Enum):
        PLATFORMS = 'PLATFORMS'
        CATEGORIES = 'CATEGORIES'

    id = db.Column(db.Integer, primary_key=True)
    
    key = db.Column(db.String, nullable=False)
    value = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)


class Admins(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    
    email = db.Column(db.String, unique=True, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class UserSkoolSubscription(db.Model):
    __tablename__ = 'user_subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subscribed_at = db.Column(db.DateTime, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class UserOfferTopicPreferences(db.Model):
    __tablename__ = 'user_offer_topic_preferences'
    id = db.Column(db.Integer, primary_key=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    categories = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)


class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.String, primary_key=True)

    # Image URL?
    
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    category = db.Column(db.String, nullable=False) # General category
    specific_category = db.Column(db.String, nullable=True)
    budget = db.Column(db.String, nullable=True)

    client_name = db.Column(db.String, nullable=True)

    url = db.Column(db.String, nullable=False)
    platform = db.Column(db.String, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
