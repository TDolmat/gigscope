from flask import jsonify
from core.models import User, UserEmailPreference, UserSubscription, UserOfferEmail, Offer, db
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import func
from collections import defaultdict
from . import bp


@bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics including counts and time-series data.
    """
    try:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # 1. Active email subscribers (users with active circle subscription AND email preferences)
        active_email_subscribers = db.session.query(func.count(func.distinct(User.id))).filter(
            User.id.in_(
                db.session.query(UserEmailPreference.user_id).filter(
                    UserEmailPreference.deleted_at.is_(None)
                )
            ),
            User.email.in_(
                db.session.query(UserSubscription.email).filter(
                    UserSubscription.expires_at > now
                )
            )
        ).scalar() or 0
        
        # 2. Active circle subscribers
        active_circle_subscribers = db.session.query(func.count(UserSubscription.id)).filter(
            UserSubscription.expires_at > now
        ).scalar() or 0
        
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
        
        # 2. Circle subscriptions created per day (last 30 days)
        circle_subs_data = db.session.query(
            func.date(UserSubscription.created_at).label('date'),
            func.count(UserSubscription.id).label('count')
        ).filter(
            UserSubscription.created_at >= thirty_days_ago
        ).group_by(
            func.date(UserSubscription.created_at)
        ).all()
        
        # 3. Offers scraped per day (last 30 days)
        offers_data = db.session.query(
            func.date(Offer.created_at).label('date'),
            func.count(Offer.id).label('count')
        ).filter(
            Offer.created_at >= thirty_days_ago
        ).group_by(
            func.date(Offer.created_at)
        ).all()
        
        # 4. GigScope subscriptions (email preferences) created per day (last 30 days)
        gigscope_subs_data = db.session.query(
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
                'active_circle_subscribers': active_circle_subscribers,
                'total_sent_emails': total_sent_emails,
                'total_scraped_offers': total_scraped_offers,
            },
            'timeseries': {
                'sent_emails': format_timeseries(sent_emails_data),
                'circle_subscriptions': format_timeseries(circle_subs_data),
                'scraped_offers': format_timeseries(offers_data),
                'gigscope_subscriptions': format_timeseries(gigscope_subs_data),
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas pobierania statystyk'}), HTTPStatus.INTERNAL_SERVER_ERROR

