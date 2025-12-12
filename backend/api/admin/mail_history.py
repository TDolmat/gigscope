from flask import request, jsonify
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from core.models import db, UserOfferEmail, User
from sqlalchemy import func, cast, Date
from datetime import datetime
from . import bp


@bp.route('/mail-history', methods=['GET'])
@jwt_required()
def get_mail_history():
    """Get mail history grouped by date with sent emails count."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Limit per_page to prevent abuse
    per_page = min(per_page, 100)
    
    # Get distinct dates with email counts
    # Using sent_at for sent emails only
    dates_query = db.session.query(
        cast(UserOfferEmail.sent_at, Date).label('date'),
        func.count(UserOfferEmail.id).label('count')
    ).filter(
        UserOfferEmail.sent_at.isnot(None)
    ).group_by(
        cast(UserOfferEmail.sent_at, Date)
    ).order_by(
        cast(UserOfferEmail.sent_at, Date).desc()
    )
    
    # Paginate
    total = dates_query.count()
    dates = dates_query.offset((page - 1) * per_page).limit(per_page).all()
    
    result = []
    for date_row in dates:
        result.append({
            'date': date_row.date.isoformat() if date_row.date else None,
            'emails_sent': date_row.count
        })
    
    return jsonify({
        'history': result,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page if per_page > 0 else 0,
            'has_next': page * per_page < total,
            'has_prev': page > 1,
        }
    }), HTTPStatus.OK


@bp.route('/mail-history/<date>', methods=['GET'])
@jwt_required()
def get_mail_history_by_date(date):
    """Get all emails sent on a specific date."""
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), HTTPStatus.BAD_REQUEST
    
    # Get all emails sent on this date
    emails = UserOfferEmail.query.filter(
        cast(UserOfferEmail.sent_at, Date) == target_date
    ).order_by(
        UserOfferEmail.sent_at.desc()
    ).all()
    
    result = []
    for email in emails:
        # Get user email
        user = User.query.get(email.user_id) if email.user_id else None
        
        result.append({
            'id': email.id,
            'email_sent_to': email.email_sent_to,
            'email_title': email.email_title,
            'sent_at': email.sent_at.isoformat() if email.sent_at else None,
            'user_email': user.email if user else email.email_sent_to,
        })
    
    return jsonify({
        'date': date,
        'emails': result
    }), HTTPStatus.OK


@bp.route('/mail-history/preview/<int:email_id>', methods=['GET'])
@jwt_required()
def get_email_preview(email_id):
    """Get the HTML content of a specific sent email."""
    email = UserOfferEmail.query.get(email_id)
    
    if not email:
        return jsonify({'error': 'Email not found'}), HTTPStatus.NOT_FOUND
    
    return jsonify({
        'id': email.id,
        'email_sent_to': email.email_sent_to,
        'email_title': email.email_title,
        'email_body': email.email_body,
        'sent_at': email.sent_at.isoformat() if email.sent_at else None,
    }), HTTPStatus.OK

