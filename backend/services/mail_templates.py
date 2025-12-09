"""
Email HTML templates for AI Scoper.
All template generation functions are here to keep mail.py clean.
"""
from typing import List
from core.models import Offer


def get_base_styles() -> str:
    """Return base CSS styles for emails - dark theme with brand accents."""
    return """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #191B1F;
            color: #FFFFFF;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logo {
            font-family: 'Permanent Marker', cursive;
            font-size: 36px;
            font-weight: 400;
            color: #F1E388;
            letter-spacing: 2px;
            text-shadow: 0 0 30px rgba(241, 227, 136, 0.5), 0 0 60px rgba(241, 227, 136, 0.3);
        }
        
        .tagline {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
            margin-top: 6px;
        }
        
        .card {
            background: #2B2E33;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 20px;
        }
        
        .card-highlight {
            background: linear-gradient(135deg, rgba(241, 227, 136, 0.1) 0%, #2B2E33 100%);
            border: 1px solid rgba(241, 227, 136, 0.2);
        }
        
        .offer-card {
            background: #2B2E33;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 12px;
        }
        
        .offer-card:hover {
            border-color: #F1E388;
        }
        
        .offer-title {
            font-size: 16px;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 8px;
            margin-top: 10px;
            line-height: 1.4;
        }
        
        .offer-title a {
            color: #FFFFFF;
            text-decoration: none;
        }
        
        .offer-title a:hover {
            color: #F1E388;
        }
        
        .offer-description {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-bottom: 14px;
            line-height: 1.5;
        }
        
        .offer-platform {
            display: inline-block;
            background: #F1E388;
            color: #191B1F;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .btn {
            display: inline-block;
            padding: 14px 28px;
            border-radius: 16px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            text-align: center;
        }
        
        .btn-primary {
            background: #F1E388;
            color: #191B1F;
        }
        
        .btn-secondary {
            background: #E5E7EB;
            color: #191B1F;
        }
        
        .footer {
            text-align: center;
            padding-top: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 32px;
        }
        
        .footer-links {
            margin-bottom: 16px;
        }
        
        .footer-links a {
            color: #60A5FA;
            text-decoration: none;
            font-size: 13px;
            margin: 0 10px;
        }
        
        .footer-links a:hover {
            color: #93C5FD;
        }
        
        .footer-text {
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
        }
        
        .highlight-number {
            font-size: 48px;
            font-weight: 700;
            color: #F1E388;
            text-shadow: 0 0 30px rgba(241, 227, 136, 0.3);
        }
        
    </style>
    """


def get_email_wrapper(content: str) -> str:
    """Wrap content in base email structure."""
    return f""" 
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Scoper</title>
        <!--[if !mso]><!-->
        <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" rel="stylesheet">
        <!--<![endif]-->
        {get_base_styles()}
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo" style="font-family: 'Permanent Marker', 'Marker Felt', 'Comic Sans MS', cursive; font-size: 36px; font-weight: 400; color: #F1E388; letter-spacing: 2px; text-shadow: 0 0 30px rgba(241, 227, 136, 0.5), 0 0 60px rgba(241, 227, 136, 0.3);">AI Scoper</div>
                <div class="tagline">Twój osobisty łowca zleceń • Be Free Club</div>
            </div>
            
            {content}
        </div>
    </body>
    </html>
    """


def generate_offers_email(offers: List[Offer], preferences_url: str, unsubscribe_url: str) -> str:
    """Generate email HTML with job offers."""
    
    offers_html = ""
    for offer in offers:
        # Build meta items with separators
        meta_items = []
        
        if offer.budget:
            meta_items.append(f'<span style="color: #22C55E; font-weight: 600;">{offer.budget}</span>')
        
        if offer.client_name:
            meta_items.append(f'<span style="color: rgba(255, 255, 255, 0.5);">{offer.client_name}</span>')
        
        if offer.client_location:
            meta_items.append(f'<span style="color: rgba(255, 255, 255, 0.5);">{offer.client_location}</span>')
        
        # Join with bullet separator
        meta_html = ' <span style="color: rgba(255, 255, 255, 0.2); margin: 0 8px;">•</span> '.join(meta_items) if meta_items else ''
        
        description = offer.description or 'Brak opisu'
        if len(description) > 200:
            description = description[:200] + '...'
        
        offers_html += f"""
        <a href="{offer.url}" target="_blank" style="text-decoration: none; display: block;">
            <div class="offer-card" style="cursor: pointer;">
                <div class="offer-platform">{offer.platform}</div>
                <h3 class="offer-title" style="color: #FFFFFF;">{offer.title}</h3>
                <p class="offer-description">{description}</p>
                <div style="font-size: 13px; margin-top: 14px;">
                    {meta_html}
                </div>
                <p style="margin-top: 10px; font-size: 10px; color: rgba(255, 255, 255, 0.3); word-break: break-all;">{offer.url}</p>
            </div>
        </a>
        """
    
    content = f"""
    <div class="card card-highlight" style="text-align: center;">
        <div class="highlight-number">{len(offers)}</div>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 15px; margin-top: 8px;">
            nowych ofert dopasowanych do Twoich słów kluczowych
        </p>
    </div>
    
    <div style="margin-bottom: 32px;">
        {offers_html}
    </div>
    
    <div class="footer">
        <div class="footer-links">
            <a href="{preferences_url}" target="_blank">Zmień słowa kluczowe</a>
            <span style="color: rgba(255, 255, 255, 0.2);">•</span>
            <a href="{unsubscribe_url}" target="_blank">Wypisz się</a>
        </div>
        <p class="footer-text">
            Ten email został wysłany przez AI Scoper.<br>
            Otrzymujesz go, bo zapisałeś się na powiadomienia o ofertach.
        </p>
    </div>
    """
    
    return get_email_wrapper(content)


def generate_no_offers_email(preferences_url: str, unsubscribe_url: str) -> str:
    """Generate email HTML when no offers match."""
    
    content = f"""
    <div class="card card-highlight" style="text-align: center;">
        <h2 style="font-size: 22px; margin-bottom: 12px; color: #FFFFFF; font-weight: 600;">
            Brak nowych ofert na dzisiaj
        </h2>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 15px; line-height: 1.6; max-width: 400px; margin: 0 auto 20px;">
            Nie znaleźliśmy dziś nowych ofert pasujących do Twoich słów kluczowych. 
            Może warto rozszerzyć kryteria wyszukiwania?
        </p>
        <a href="{preferences_url}" target="_blank" class="btn btn-primary">
            Zmień słowa kluczowe
        </a>
    </div>
    
    <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 14px; color: #FFFFFF; font-weight: 600;">
            Wskazówki
        </h3>
        <ul style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding-left: 20px; line-height: 1.7;">
            <li style="margin-bottom: 6px;">Dodaj więcej słów kluczowych w sekcji "Może zawierać"</li>
            <li style="margin-bottom: 6px;">Użyj bardziej ogólnych terminów</li>
            <li style="margin-bottom: 6px;">Dodaj słowa kluczowe w języku angielskim</li>
            <li>Sprawdź czy słowa w "Musi zawierać" nie są zbyt specyficzne</li>
        </ul>
    </div>
    
    <div class="footer">
        <div class="footer-links">
            <a href="{preferences_url}" target="_blank">Zmień słowa kluczowe</a>
            <span style="color: rgba(255, 255, 255, 0.2);">•</span>
            <a href="{unsubscribe_url}" target="_blank">Wypisz się</a>
        </div>
        <p class="footer-text">
            Ten email został wysłany przez AI Scoper.<br>
            Otrzymujesz go, bo zapisałeś się na powiadomienia o ofertach.
        </p>
    </div>
    """
    
    return get_email_wrapper(content)


def generate_expired_subscription_email(circle_url: str, preferences_url: str, unsubscribe_url: str) -> str:
    """Generate email HTML for users with expired subscription."""
    
    content = f"""
    <div class="card card-highlight" style="text-align: center;">
        <h2 style="font-size: 22px; margin-bottom: 12px; color: #FFFFFF; font-weight: 600;">
            Twoja subskrypcja wygasła
        </h2>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 15px; line-height: 1.6; max-width: 400px; margin: 0 auto 20px;">
            Nie chcemy, żebyś przegapił świetne zlecenia! Odnów subskrypcję,
            a my wrócimy do codziennego wyszukiwania ofert dopasowanych do Twoich słów kluczowych.
        </p>
        <a href="{circle_url}" target="_blank" class="btn btn-primary">
            Odnów subskrypcję
        </a>
    </div>
    
    <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 14px; color: #FFFFFF; font-weight: 600;">
            Co tracisz?
        </h3>
        <ul style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding-left: 20px; line-height: 1.7;">
            <li style="margin-bottom: 6px;">Codzienne powiadomienia o nowych zleceniach</li>
            <li style="margin-bottom: 6px;">Oferty dopasowane do Twoich słów kluczowych</li>
            <li style="margin-bottom: 6px;">Wczesny dostęp do najnowszych projektów</li>
            <li>Oszczędność czasu na ręcznym przeszukiwaniu platform</li>
        </ul>
    </div>
    
    <div class="footer">
        <div class="footer-links">
            <a href="{preferences_url}" target="_blank">Zmień słowa kluczowe</a>
            <span style="color: rgba(255, 255, 255, 0.2);">•</span>
            <a href="{unsubscribe_url}" target="_blank">Wypisz się</a>
        </div>
        <p class="footer-text">
            Ten email został wysłany przez AI Scoper.<br>
            Otrzymujesz go, bo wcześniej korzystałeś z naszych powiadomień.
        </p>
    </div>
    """
    
    return get_email_wrapper(content)


def generate_not_subscribed_email(
    offers_count: int, 
    is_expired: bool, 
    circle_url: str, 
    preferences_url: str, 
    unsubscribe_url: str
) -> str:
    """Generate email HTML for non-subscribers."""
    
    if is_expired:
        title = "Twoja subskrypcja wygasła"
        message = """
            Znaleźliśmy oferty dopasowane do Twoich słów kluczowych, 
            ale wygasła Ci subskrypcja. Odnów ją, aby dalej otrzymywać 
            codzienne powiadomienia z ofertami.
        """
        cta_text = "Odnów subskrypcję"
    else:
        title = "Masz nowe oferty!"
        message = """
            Znaleźliśmy oferty dopasowane do Twoich słów kluczowych, 
            ale niestety nie jesteś członkiem społeczności Be Free Club. 
            Dołącz, aby otrzymywać spersonalizowane oferty codziennie!
        """
        cta_text = "Dołącz do Be Free Club"
    
    # Generate masked offer cards (email-client compatible - no CSS blur)
    masked_offers = ""
    for i in range(min(offers_count, 3)):
        masked_offers += """
        <div style="background: #2B2E33; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 12px;">
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.4); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.3px;">██████</div>
            <h3 style="font-size: 16px; font-weight: 600; color: rgba(255, 255, 255, 0.3); margin-bottom: 8px; margin-top: 10px; line-height: 1.4;">████████ ████ ████████ ██████████</h3>
            <p style="color: rgba(255, 255, 255, 0.2); font-size: 14px; margin-bottom: 14px; line-height: 1.5;">████████ ████ ██████████ ████████ ████ ██████ ████████████ ████ ██████...</p>
            <div style="font-size: 13px;">
                <span style="color: rgba(255, 255, 255, 0.3); font-weight: 600;">$████</span>
                <span style="color: rgba(255, 255, 255, 0.2); margin-left: 14px;">████████</span>
            </div>
        </div>
        """
    
    content = f"""
    <div class="card card-highlight" style="text-align: center;">
        <div class="highlight-number">{offers_count}</div>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 15px; margin-top: 8px;">
            ofert czeka na Ciebie
        </p>
    </div>
    
    <div class="card" style="text-align: center;">
        <h2 style="font-size: 22px; margin-bottom: 12px; color: #FFFFFF; font-weight: 600;">
            {title}
        </h2>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 15px; line-height: 1.6; max-width: 400px; margin: 0 auto 20px;">
            {message}
        </p>
        <a href="{circle_url}" target="_blank" class="btn btn-primary">
            {cta_text}
        </a>
    </div>
    
    <div style="margin-bottom: 20px;">
        {masked_offers}
    </div>
    
    <div class="footer">
        <div class="footer-links">
            <a href="{preferences_url}" target="_blank">Zmień słowa kluczowe</a>
            <span style="color: rgba(255, 255, 255, 0.2);">•</span>
            <a href="{unsubscribe_url}" target="_blank">Wypisz się</a>
        </div>
        <p class="footer-text">
            Ten email został wysłany przez AI Scoper.<br>
            Otrzymujesz go, bo zapisałeś się na powiadomienia o ofertach.
        </p>
    </div>
    """
    
    return get_email_wrapper(content)


def generate_test_email() -> str:
    """Generate test email HTML."""
    
    content = """
    <div class="card card-highlight" style="text-align: center;">
        <h2 style="font-size: 22px; margin-bottom: 12px; color: #FFFFFF; font-weight: 600;">
            Konfiguracja działa!
        </h2>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 15px; line-height: 1.6; max-width: 400px; margin: 0 auto;">
            Twoja bramka mailowa jest poprawnie skonfigurowana. 
            AI Scoper jest gotowy do wysyłania powiadomień o ofertach.
        </p>
    </div>
    
    <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 14px; color: #FFFFFF; font-weight: 600;">
            Co dalej?
        </h3>
        <ul style="color: rgba(255, 255, 255, 0.6); font-size: 14px; padding-left: 20px; line-height: 1.8;">
            <li style="margin-bottom: 8px;">
                <strong style="color: #FFFFFF;">Sprawdź ustawienia</strong> - upewnij się, że częstotliwość wysyłki i platformy są poprawnie skonfigurowane
            </li>
            <li style="margin-bottom: 8px;">
                <strong style="color: #FFFFFF;">Dodaj użytkowników</strong> - zaproś członków społeczności do zapisania się na powiadomienia
            </li>
            <li style="margin-bottom: 8px;">
                <strong style="color: #FFFFFF;">Testuj scraping</strong> - sprawdź czy scraper poprawnie pobiera oferty
            </li>
            <li>
                <strong style="color: #FFFFFF;">Uruchom automatyzację</strong> - skonfiguruj harmonogram wysyłki maili
            </li>
        </ul>
    </div>
    
    <div class="footer">
        <p class="footer-text">
            To jest testowy email z AI Scoper.<br>
            Został wysłany w celu weryfikacji konfiguracji bramki mailowej.
        </p>
    </div>
    """
    
    return get_email_wrapper(content)
