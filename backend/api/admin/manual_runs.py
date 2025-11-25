from flask import request, jsonify
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from . import bp


@bp.route('/manual-runs/scrape-all', methods=['POST'])
@jwt_required()
def scrape_all_users():
    """Manually trigger scraping for all subscribed users."""
    from services.scrape import scrape_offers_for_all_users
    
    try:
        print_logs = request.json.get('print_logs', False) if request.json else False
        
        result = scrape_offers_for_all_users(print_logs=print_logs)
        
        if 'error' in result:
            return jsonify({
                'success': False,
                'error': result['error']
            }), HTTPStatus.INTERNAL_SERVER_ERROR
        
        return jsonify({
            'success': True,
            'message': f'Scraping completed for {result["successful_scrapes"]} users',
            'total_users': result['total_users'],
            'successful_scrapes': result['successful_scrapes'],
            'failed_scrapes': result['failed_scrapes'],
            'total_scraped_offers': result['total_scraped_offers'],
            'total_duration_millis': result.get('total_duration_millis', 0),
            'average_duration_millis': result.get('average_duration_millis', 0),
            'results': result['results']
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error in scrape_all_users: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Wystąpił błąd podczas scrapowania: {str(e)}'
        }), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/manual-runs/send-emails', methods=['POST'])
@jwt_required()
def send_all_emails():
    """Manually trigger sending emails to all users."""
    from services.mail import send_user_offer_emails
    from core.config import CONFIG
    
    try:
        data = request.json or {}
        base_url = data.get('base_url', CONFIG.BASE_URL)
        circle_url = data.get('circle_url', CONFIG.CIRCLE_URL)
        
        result = send_user_offer_emails(base_url=base_url, circle_url=circle_url)
        
        if not result.get('success') and result.get('error'):
            return jsonify({
                'success': False,
                'error': result['error']
            }), HTTPStatus.INTERNAL_SERVER_ERROR
        
        return jsonify({
            'success': result.get('success', False),
            'message': f'Emails sent: {result["summary"]["total_sent"]}, failed: {result["summary"]["total_failed"]}',
            'summary': result.get('summary', {}),
            'results': result.get('results', {})
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error in send_all_emails: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Wystąpił błąd podczas wysyłania emaili: {str(e)}'
        }), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/manual-runs/scrape-and-send', methods=['POST'])
@jwt_required()
def scrape_and_send_all():
    """Manually trigger scraping for all users followed by sending emails."""
    from services.scrape import scrape_offers_for_all_users
    from services.mail import send_user_offer_emails
    from core.config import CONFIG
    
    try:
        data = request.json or {}
        print_logs = data.get('print_logs', False)
        base_url = data.get('base_url', CONFIG.BASE_URL)
        circle_url = data.get('circle_url', CONFIG.CIRCLE_URL)
        
        # Step 1: Scrape offers for all users
        scrape_result = scrape_offers_for_all_users(print_logs=print_logs)
        
        if 'error' in scrape_result:
            return jsonify({
                'success': False,
                'error': f'Błąd podczas scrapowania: {scrape_result["error"]}',
                'scrape_result': scrape_result,
                'mail_result': None
            }), HTTPStatus.INTERNAL_SERVER_ERROR
        
        # Step 2: Send emails to all users
        mail_result = send_user_offer_emails(base_url=base_url, circle_url=circle_url)
        
        # Combined result
        overall_success = scrape_result.get('failed_scrapes', 0) == 0 and mail_result.get('success', False)
        
        return jsonify({
            'success': overall_success,
            'message': f'Scraping: {scrape_result["successful_scrapes"]}/{scrape_result["total_users"]} users, '
                      f'Emails: {mail_result["summary"]["total_sent"]} sent, {mail_result["summary"]["total_failed"]} failed',
            'scrape_result': {
                'total_users': scrape_result['total_users'],
                'successful_scrapes': scrape_result['successful_scrapes'],
                'failed_scrapes': scrape_result['failed_scrapes'],
                'total_scraped_offers': scrape_result['total_scraped_offers'],
                'total_duration_millis': scrape_result.get('total_duration_millis', 0),
            },
            'mail_result': {
                'summary': mail_result.get('summary', {}),
                'results': mail_result.get('results', {})
            }
        }), HTTPStatus.OK
        
    except Exception as e:
        print(f"Error in scrape_and_send_all: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Wystąpił błąd: {str(e)}'
        }), HTTPStatus.INTERNAL_SERVER_ERROR

