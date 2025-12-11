from flask import jsonify
from core.models import User, UserEmailPreference, UserOfferEmail, Offer, db
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import func
from collections import defaultdict
from . import bp
from helpers.user_helper import get_subscribers, clear_subscribers_cache


@bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics including counts and time-series data.
    BeFreeClub subscribers are fetched from external API.
    """
    try:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # 1. Active email subscribers (users with active email preferences whose email is in BeFreeClub list)
        # Refresh subscribers from BeFreeClub API
        clear_subscribers_cache()
        befreeclub_subscribers = get_subscribers()
        
        # Get users with active preferences
        users_with_preferences = db.session.query(User.email).join(
            UserEmailPreference,
            UserEmailPreference.user_id == User.id
        ).filter(
            UserEmailPreference.deleted_at.is_(None)
        ).distinct().all()
        
        # Count users that are also in BeFreeClub subscribers
        active_email_subscribers = sum(
            1 for u in users_with_preferences 
            if u.email.lower() in befreeclub_subscribers
        )
        
        # 2. Active BeFreeClub subscribers (from external API)
        active_befreeclub_subscribers = len(befreeclub_subscribers)
        
        # 3. Total sent emails
        total_sent_emails = db.session.query(func.count(UserOfferEmail.id)).filter(
            UserOfferEmail.sent_at.isnot(None)
        ).scalar() or 0
        
        # 4. Total scraped offers
        total_scraped_offers = db.session.query(func.count(Offer.id)).scalar() or 0
        
        # Time-series data for last 30 days
        
        # 1. Sent emails per day (last 30 days)
        sent_emails_data = db.session.query(
            func.date(UserOfferEmail.sent_at).label('date'),
            func.count(UserOfferEmail.id).label('count')
        ).filter(
            UserOfferEmail.sent_at >= thirty_days_ago,
            UserOfferEmail.sent_at.isnot(None)
        ).group_by(
            func.date(UserOfferEmail.sent_at)
        ).all()
        
        # 2. Offers scraped per day (last 30 days)
        offers_data = db.session.query(
            func.date(Offer.created_at).label('date'),
            func.count(Offer.id).label('count')
        ).filter(
            Offer.created_at >= thirty_days_ago
        ).group_by(
            func.date(Offer.created_at)
        ).all()
        
        # 3. AI Scoper subscriptions (email preferences) created per day (last 30 days)
        scoper_subs_data = db.session.query(
            func.date(UserEmailPreference.created_at).label('date'),
            func.count(UserEmailPreference.id).label('count')
        ).filter(
            UserEmailPreference.created_at >= thirty_days_ago
        ).group_by(
            func.date(UserEmailPreference.created_at)
        ).all()
        
        # Format time-series data with all 30 days (fill missing days with 0)
        def format_timeseries(data, days=30):
            result = defaultdict(int)
            for item in data:
                result[item.date.isoformat()] = item.count
            
            # Fill all 30 days
            formatted = []
            for i in range(days):
                date = (now - timedelta(days=days-i-1)).date()
                formatted.append({
                    'date': date.isoformat(),
                    'count': result.get(date.isoformat(), 0)
                })
            
            return formatted
        
        return jsonify({
            'summary': {
                'active_email_subscribers': active_email_subscribers,
                'active_befreeclub_subscribers': active_befreeclub_subscribers,
                'total_sent_emails': total_sent_emails,
                'total_scraped_offers': total_scraped_offers,
            },
            'timeseries': {
                'sent_emails': format_timeseries(sent_emails_data),
                'scraped_offers': format_timeseries(offers_data),
                'scoper_subscriptions': format_timeseries(scoper_subs_data),
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas pobierania statystyk'}), HTTPStatus.INTERNAL_SERVER_ERROR
