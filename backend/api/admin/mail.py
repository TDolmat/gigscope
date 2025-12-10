from flask import request, jsonify
from core.models import AppSettings, db, Offer
from http import HTTPStatus
from flask_jwt_extended import jwt_required
from services.mail import MailService, send_user_offer_emails
from services.mail_templates import (
    generate_offers_email,
    generate_no_offers_email,
    generate_not_subscribed_email,
    generate_expired_subscription_email,
    generate_test_email
)
from . import bp


@bp.route('/mail/test', methods=['POST'])
@jwt_required()
def send_test_mail():
    """
    Send a test email to verify mail configuration.
    Expects: { "email": "test@example.com" }
    """
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'error': 'Email jest wymagany'}), HTTPStatus.BAD_REQUEST
    
    email = data['email']
    
    try:
        mail_service = MailService.from_settings()
        
        if not mail_service:
            return jsonify({
                'error': 'Bramka mailowa nie jest skonfigurowana. Ustaw klucz API i adres nadawcy w ustawieniach.'
            }), HTTPStatus.BAD_REQUEST
        
        result = mail_service.send_test_email(to=email)
        
        if result.get('success'):
            return jsonify({
                'message': f'Testowy email został wysłany na adres {email}',
                'email_id': result.get('id')
            }), HTTPStatus.OK
        else:
            return jsonify({
                'error': f'Nie udało się wysłać emaila: {result.get("error")}'
            }), HTTPStatus.INTERNAL_SERVER_ERROR
            
    except Exception as e:
        return jsonify({
            'error': f'Wystąpił błąd: {str(e)}'
        }), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/mail/send-offers', methods=['POST'])
@jwt_required()
def trigger_user_offer_emails():
    """
    Manually trigger sending offer emails to all users.
    This is useful for testing or manual triggers.
    """
    data = request.get_json() or {}
    
    base_url = data.get('base_url', 'https://scoper.befreeclub.pro')
    circle_url = data.get('circle_url', 'https://www.befreeclub.pro')
    
    try:
        result = send_user_offer_emails(base_url=base_url, circle_url=circle_url)
        
        if result.get('success'):
            return jsonify({
                'message': f'Wysłano {result["sent"]} emaili',
                'total_users': result['total_users'],
                'sent': result['sent'],
                'failed': result['failed'],
                'skipped': result['skipped'],
                'details': result['details']
            }), HTTPStatus.OK
        else:
            return jsonify({
                'error': result.get('error', 'Nie wszystkie emaile zostały wysłane'),
                'total_users': result.get('total_users', 0),
                'sent': result.get('sent', 0),
                'failed': result.get('failed', 0),
                'skipped': result.get('skipped', 0),
                'details': result.get('details', [])
            }), HTTPStatus.PARTIAL_CONTENT
            
    except Exception as e:
        return jsonify({
            'error': f'Wystąpił błąd: {str(e)}'
        }), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/mail/preview', methods=['POST'])
@jwt_required()
def preview_email():
    """
    Generate and return email HTML preview without sending.
    Expects: { "type": "offers" | "no_offers" | "not_subscribed" | "expired" | "test" }
    """
    data = request.get_json() or {}
    email_type = data.get('type', 'test')
    
    try:
        if email_type == 'test':
            html = generate_test_email()
        elif email_type == 'no_offers':
            html = generate_no_offers_email(
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        elif email_type == 'not_subscribed':
            html = generate_not_subscribed_email(
                offers_count=5,
                is_expired=False,
                circle_url='https://www.befreeclub.pro',
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        elif email_type == 'expired':
            html = generate_expired_subscription_email(
                circle_url='https://www.befreeclub.pro',
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        elif email_type == 'offers':
            # Get some sample offers for preview
            sample_offers = [
                Offer(
                    title="Senior Full Stack Developer dla startupu SaaS",
                    description="Szukamy doświadczonego programisty do pracy nad platformą B2B. Wymagane: React, Node.js, PostgreSQL. Praca zdalna, elastyczne godziny.",
                    budget="$50-80/hr",
                    platform="upwork",
                    url="https://www.upwork.com/freelance-jobs/apply/Full-Stack-Developer-for-Growing-SaaS-Company_~021916236189806305234/",
                    client_location="USA",
                    client_name="Startup SaaS"
                ),
                Offer(
                    title="UI/UX Designer - Redesign aplikacji mobilnej",
                    description="Potrzebujemy designera do stworzenia nowego interfejsu aplikacji fitness. Figma, prototypowanie, user research.",
                    budget="$2,000",
                    platform="upwork",
                    url="https://www.upwork.com/freelance-jobs/apply/UX-UI-Designer-for-Mobile-App-Redesign_~021915798726805439765/",
                    client_location="UK",
                    client_name="Fitness App"
                ),
                Offer(
                    title="WordPress Developer - Custom Theme",
                    description="Stworzenie customowego theme'a WordPress dla agencji marketingowej. Wymagana znajomość ACF, Elementor.",
                    budget="$1,500",
                    platform="upwork",
                    url="https://www.upwork.com/freelance-jobs/apply/WordPress-Developer-Custom-Theme-Development_~021916142837651259853/",
                    client_location="Polska",
                    client_name="Agencja Marketingowa",
                ),
            ]
        
            html = generate_offers_email(
                offers=sample_offers,
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        else:
            return jsonify({
                'error': 'Nieprawidłowy typ emaila. Dozwolone: offers, no_offers, not_subscribed, expired, test'
            }), HTTPStatus.BAD_REQUEST
        
        return jsonify({
            'html': html,
            'type': email_type
        }), HTTPStatus.OK
        
    except Exception as e:
        return jsonify({
            'error': f'Wystąpił błąd: {str(e)}'
        }), HTTPStatus.INTERNAL_SERVER_ERROR


@bp.route('/mail/send-template', methods=['POST'])
@jwt_required()
def send_template_email():
    """
    Send an email with a specific template to a test address.
    Expects: { "type": "offers" | "no_offers" | "not_subscribed" | "expired" | "test", "email": "test@example.com" }
    """
    data = request.get_json() or {}
    email_type = data.get('type', 'test')
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email jest wymagany'}), HTTPStatus.BAD_REQUEST
    
    try:
        mail_service = MailService.from_settings()
        
        if not mail_service:
            return jsonify({
                'error': 'Bramka mailowa nie jest skonfigurowana. Ustaw klucz API i adres nadawcy w ustawieniach.'
            }), HTTPStatus.BAD_REQUEST
        
        # Generate the template HTML
        if email_type == 'test':
            subject = "AI Scoper - Test połączenia z bramką mailową"
            html = generate_test_email()
        elif email_type == 'no_offers':
            subject = "AI Scoper - Brak nowych ofert na dzisiaj"
            html = generate_no_offers_email(
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        elif email_type == 'not_subscribed':
            subject = "AI Scoper - 5 ofert czeka na Ciebie!"
            html = generate_not_subscribed_email(
                offers_count=5,
                is_expired=False,
                circle_url='https://www.befreeclub.pro',
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        elif email_type == 'expired':
            subject = "Twoja subskrypcja AI Scoper wygasła - odnów ją!"
            html = generate_expired_subscription_email(
                circle_url='https://www.befreeclub.pro',
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        elif email_type == 'offers':
            sample_offers = [
                Offer(
                    title="Senior Full Stack Developer dla startupu SaaS",
                    description="Szukamy doświadczonego programisty do pracy nad platformą B2B. Wymagane: React, Node.js, PostgreSQL. Praca zdalna, elastyczne godziny.",
                    budget="$50-80/hr",
                    platform="upwork",
                    url="https://www.upwork.com/freelance-jobs/apply/Full-Stack-Developer-for-Growing-SaaS-Company_~021916236189806305234/",
                    client_location="USA",
                    client_name="Startup SaaS"
                ),
                Offer(
                    title="UI/UX Designer - Redesign aplikacji mobilnej",
                    description="Potrzebujemy designera do stworzenia nowego interfejsu aplikacji fitness. Figma, prototypowanie, user research.",
                    budget="$2,000",
                    platform="upwork",
                    url="https://www.upwork.com/freelance-jobs/apply/UX-UI-Designer-for-Mobile-App-Redesign_~021915798726805439765/",
                    client_location="UK",
                    client_name="Fitness App"
                ),
                Offer(
                    title="WordPress Developer - Custom Theme",
                    description="Stworzenie customowego theme'a WordPress dla agencji marketingowej. Wymagana znajomość ACF, Elementor.",
                    budget="$1,500",
                    platform="upwork",
                    url="https://www.upwork.com/freelance-jobs/apply/WordPress-Developer-Custom-Theme-Development_~021916142837651259853/",
                    client_location="Polska",
                    client_name="Agencja Marketingowa"
                ),
            ]
            
            subject = f"AI Scoper - {len(sample_offers)} nowych ofert dla Ciebie!"
            html = generate_offers_email(
                offers=sample_offers,
                preferences_url='https://scoper.befreeclub.pro/email-preferences/example-token',
                unsubscribe_url='https://scoper.befreeclub.pro/unsubscribe/example-token'
            )
        else:
            return jsonify({
                'error': 'Nieprawidłowy typ emaila. Dozwolone: offers, no_offers, not_subscribed, expired, test'
            }), HTTPStatus.BAD_REQUEST
        
        # Send the email
        result = mail_service.send_email(to=email, subject=subject, html=html)
        
        if result.get('success'):
            return jsonify({
                'message': f'Email "{email_type}" został wysłany na adres {email}',
                'email_id': result.get('id'),
                'type': email_type
            }), HTTPStatus.OK
        else:
            return jsonify({
                'error': f'Nie udało się wysłać emaila: {result.get("error")}'
            }), HTTPStatus.INTERNAL_SERVER_ERROR
            
    except Exception as e:
        return jsonify({
            'error': f'Wystąpił błąd: {str(e)}'
        }), HTTPStatus.INTERNAL_SERVER_ERROR

