from flask import jsonify
from core.models import User, UserEmailPreference, UserOfferEmail, Offer, OfferBundle, AppSettings, ScrapeLog, MailLog, db
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


@bp.route('/dashboard/status', methods=['GET'])
@jwt_required()
def get_dashboard_status():
    """
    Get today's scrape and mail status for the dashboard.
    Returns status (scheduled/running/completed) with details for tooltips.
    """
    try:
        now = datetime.now()  # Use local time for display
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get app settings for scheduled times
        settings = AppSettings.query.first()
        if not settings:
            return jsonify({'error': 'Brak ustawień aplikacji'}), HTTPStatus.INTERNAL_SERVER_ERROR
        
        # Parse scheduled times
        email_time = settings.email_daytime or '09:00'
        email_hour, email_minute = map(int, email_time.split(':'))
        scrape_hour = email_hour - 1 if email_hour > 0 else 23
        scrape_time = f"{scrape_hour:02d}:{email_minute:02d}"
        
        # ==================== SCRAPE STATUS ====================
        today_scrape_log = ScrapeLog.query.filter(
            ScrapeLog.executed_at >= today_start
        ).order_by(ScrapeLog.executed_at.desc()).first()
        
        # Get platform breakdown from today's offers
        platform_stats = {}
        if today_scrape_log:
            # Get offers scraped today grouped by platform
            today_offers = db.session.query(
                Offer.platform,
                func.count(Offer.id).label('count')
            ).filter(
                Offer.created_at >= today_start
            ).group_by(Offer.platform).all()
            
            for platform, count in today_offers:
                platform_stats[platform] = count
        
        # Determine scrape status
        if settings.is_scrape_running:
            scrape_status = 'running'
            scrape_time_display = settings.scrape_started_at.strftime('%H:%M') if settings.scrape_started_at else None
        elif today_scrape_log:
            scrape_status = 'completed'
            scrape_time_display = today_scrape_log.executed_at.strftime('%H:%M')
        else:
            scrape_status = 'scheduled'
            scrape_time_display = scrape_time
        
        scrape_data = {
            'status': scrape_status,
            'time': scrape_time_display,
            'scheduled_time': scrape_time,
            'total_offers': today_scrape_log.total_offers_scraped if today_scrape_log else 0,
            'total_users': today_scrape_log.total_users if today_scrape_log else 0,
            'successful': today_scrape_log.successful_scrapes if today_scrape_log else 0,
            'failed': today_scrape_log.failed_scrapes if today_scrape_log else 0,
            'platform_breakdown': platform_stats,
        }
        
        # ==================== MAIL STATUS ====================
        today_mail_log = MailLog.query.filter(
            MailLog.executed_at >= today_start
        ).order_by(MailLog.executed_at.desc()).first()
        
        # Get user details for tooltip (emails sent today)
        user_details = []
        if today_mail_log:
            # Get emails sent today with offer counts
            today_emails = db.session.query(
                UserOfferEmail.email_sent_to,
                OfferBundle.id.label('bundle_id'),
                func.count(Offer.id).label('offers_count')
            ).outerjoin(
                OfferBundle, OfferBundle.id == UserOfferEmail.offer_bundle_id
            ).outerjoin(
                Offer, Offer.offer_bundle_id == OfferBundle.id
            ).filter(
                UserOfferEmail.sent_at >= today_start
            ).group_by(
                UserOfferEmail.email_sent_to,
                OfferBundle.id
            ).all()
            
            for email, bundle_id, offers_count in today_emails:
                user_details.append({
                    'email': email,
                    'offers_count': offers_count or 0
                })
        
        # Determine mail status
        if today_mail_log:
            mail_status = 'sent'
            mail_time_display = today_mail_log.executed_at.strftime('%H:%M')
        else:
            mail_status = 'scheduled'
            mail_time_display = email_time
        
        mail_data = {
            'status': mail_status,
            'time': mail_time_display,
            'scheduled_time': email_time,
            'total_sent': today_mail_log.subscribed_sent + today_mail_log.never_subscribed_sent if today_mail_log else 0,
            'total_failed': today_mail_log.subscribed_failed + today_mail_log.never_subscribed_failed if today_mail_log else 0,
            'user_details': user_details,
        }
        
        return jsonify({
            'scrape': scrape_data,
            'mail': mail_data,
            'frequency': settings.email_frequency,
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error fetching dashboard status: {str(e)}")
        return jsonify({'error': 'Wystąpił błąd podczas pobierania statusu'}), HTTPStatus.INTERNAL_SERVER_ERROR
