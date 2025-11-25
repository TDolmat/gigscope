from flask import request, jsonify
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from core.models import db, ScrapeLog, MailLog
from . import bp


@bp.route('/logs/scrape', methods=['GET'])
@jwt_required()
def get_scrape_logs():
    """Get paginated scrape logs."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Limit per_page to prevent abuse
    per_page = min(per_page, 100)
    
    query = ScrapeLog.query.order_by(ScrapeLog.executed_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    logs = []
    for log in pagination.items:
        logs.append({
            'id': log.id,
            'executed_at': log.executed_at.isoformat() if log.executed_at else None,
            'duration_millis': log.duration_millis,
            'total_users': log.total_users,
            'successful_scrapes': log.successful_scrapes,
            'failed_scrapes': log.failed_scrapes,
            'total_offers_scraped': log.total_offers_scraped,
            'errors': log.errors or [],
        })
    
    return jsonify({
        'logs': logs,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }), HTTPStatus.OK


@bp.route('/logs/mail', methods=['GET'])
@jwt_required()
def get_mail_logs():
    """Get paginated mail logs."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Limit per_page to prevent abuse
    per_page = min(per_page, 100)
    
    query = MailLog.query.order_by(MailLog.executed_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    logs = []
    for log in pagination.items:
        logs.append({
            'id': log.id,
            'executed_at': log.executed_at.isoformat() if log.executed_at else None,
            # Subscribed
            'subscribed_total': log.subscribed_total,
            'subscribed_sent': log.subscribed_sent,
            'subscribed_failed': log.subscribed_failed,
            'subscribed_skipped': log.subscribed_skipped,
            'subscribed_errors': log.subscribed_errors or [],
            # Expired
            'expired_total': log.expired_total,
            'expired_sent': log.expired_sent,
            'expired_failed': log.expired_failed,
            'expired_errors': log.expired_errors or [],
            # Never subscribed
            'never_subscribed_total': log.never_subscribed_total,
            'never_subscribed_sent': log.never_subscribed_sent,
            'never_subscribed_failed': log.never_subscribed_failed,
            'never_subscribed_errors': log.never_subscribed_errors or [],
        })
    
    return jsonify({
        'logs': logs,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }), HTTPStatus.OK


@bp.route('/logs', methods=['GET'])
@jwt_required()
def get_all_logs():
    """Get both scrape and mail logs together (for dashboard view)."""
    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 50)
    
    scrape_logs = ScrapeLog.query.order_by(ScrapeLog.executed_at.desc()).limit(limit).all()
    mail_logs = MailLog.query.order_by(MailLog.executed_at.desc()).limit(limit).all()
    
    scrape_data = []
    for log in scrape_logs:
        scrape_data.append({
            'id': log.id,
            'executed_at': log.executed_at.isoformat() if log.executed_at else None,
            'duration_millis': log.duration_millis,
            'total_users': log.total_users,
            'successful_scrapes': log.successful_scrapes,
            'failed_scrapes': log.failed_scrapes,
            'total_offers_scraped': log.total_offers_scraped,
            'errors': log.errors or [],
        })
    
    mail_data = []
    for log in mail_logs:
        mail_data.append({
            'id': log.id,
            'executed_at': log.executed_at.isoformat() if log.executed_at else None,
            'subscribed_total': log.subscribed_total,
            'subscribed_sent': log.subscribed_sent,
            'subscribed_failed': log.subscribed_failed,
            'subscribed_skipped': log.subscribed_skipped,
            'subscribed_errors': log.subscribed_errors or [],
            'expired_total': log.expired_total,
            'expired_sent': log.expired_sent,
            'expired_failed': log.expired_failed,
            'expired_errors': log.expired_errors or [],
            'never_subscribed_total': log.never_subscribed_total,
            'never_subscribed_sent': log.never_subscribed_sent,
            'never_subscribed_failed': log.never_subscribed_failed,
            'never_subscribed_errors': log.never_subscribed_errors or [],
        })
    
    return jsonify({
        'scrape_logs': scrape_data,
        'mail_logs': mail_data,
    }), HTTPStatus.OK

