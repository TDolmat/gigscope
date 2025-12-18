"""
WorkConnect scraping service with caching logic.
Scrapes offers from WorkConnect and caches them in the database.
Cache is refreshed based on configurable cache_hours setting.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from time import sleep

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

from core.models import db, AppSettings, CachedOffer


PLATFORM = "workconnect"
BASE_URL = "https://www.workconnect.app"
BASE_OFFERS_URL = "https://www.workconnect.app/zlecenia"


def get_workconnect_settings() -> Dict[str, Any]:
    """Get WorkConnect settings from AppSettings."""
    settings = AppSettings.query.first()
    
    # Check if workconnect is in enabled_platforms list (main toggle mechanism)
    enabled_platforms = settings.enabled_platforms if settings and settings.enabled_platforms else []
    is_enabled = 'workconnect' in enabled_platforms
    
    return {
        'enabled': is_enabled,
        'mock_enabled': settings.workconnect_mock_enabled if settings and settings.workconnect_mock_enabled is not None else False,
        'cache_hours': settings.workconnect_cache_hours if settings and settings.workconnect_cache_hours is not None else 2.0,
        'max_offers': settings.workconnect_max_offers if settings and settings.workconnect_max_offers is not None else 50,
    }


def is_cache_valid() -> bool:
    """
    Check if cached offers are still valid (not older than cache_hours).
    Returns True if cache is valid and should be used, False if refresh is needed.
    """
    settings = get_workconnect_settings()
    cache_hours = settings['cache_hours'] or 2.0
    
    # Get the most recent cached offer for workconnect
    latest_offer = CachedOffer.query.filter_by(platform=PLATFORM)\
        .order_by(CachedOffer.created_at.desc())\
        .first()
    
    if not latest_offer:
        return False  # No cached offers, need to scrape
    
    # Check if the cache is still fresh
    cache_threshold = datetime.utcnow() - timedelta(hours=cache_hours)
    return latest_offer.created_at > cache_threshold


def clear_cached_offers():
    """Delete all cached WorkConnect offers."""
    CachedOffer.query.filter_by(platform=PLATFORM).delete()
    db.session.commit()


def get_cached_offers(max_offers: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get cached offers from database.
    Returns list of offer dictionaries.
    """
    query = CachedOffer.query.filter_by(platform=PLATFORM)\
        .order_by(CachedOffer.created_at.desc())
    
    if max_offers:
        query = query.limit(max_offers)
    
    offers = query.all()
    
    return [
        {
            'title': offer.title,
            'description': offer.description,
            'url': offer.url,
            'budget': offer.budget,
            'client_name': offer.client_name,
            'client_location': offer.client_location,
            'category': offer.category,
            'platform': PLATFORM,
        }
        for offer in offers
    ]


def save_offers_to_cache(offers: List[Dict[str, Any]]):
    """Save scraped offers to cache."""
    for offer_data in offers:
        cached_offer = CachedOffer(
            platform=PLATFORM,
            title=offer_data.get('title', ''),
            description=offer_data.get('description', ''),
            url=offer_data.get('url', ''),
            budget=offer_data.get('budget', ''),
            client_name=offer_data.get('client_name', ''),
            client_location=offer_data.get('client_location', ''),
            category=offer_data.get('category', ''),
        )
        db.session.add(cached_offer)
    
    db.session.commit()


def _create_driver() -> webdriver.Chrome:
    """Create and configure Chrome WebDriver."""
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    return webdriver.Chrome(options=options)


def scrape_workconnect_offers(max_offers: int = 50, print_logs: bool = True) -> List[Dict[str, Any]]:
    """
    Scrape offers from WorkConnect using Selenium.
    
    Args:
        max_offers: Maximum number of offers to scrape
        print_logs: Whether to print progress logs
    
    Returns:
        List of offer dictionaries
    """
    offers = []
    seen_urls = set()
    
    driver = None
    try:
        driver = _create_driver()
        driver.get(BASE_OFFERS_URL)
        sleep(1)  # Wait for page to load
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find category list
        ul_element = soup.select_one("div.mt-6 div.relative ul")
        if not ul_element:
            if print_logs:
                print("Could not find category list on WorkConnect")
            return offers
        
        li_elements = ul_element.find_all("li", recursive=False)
        
        for li in li_elements:
            if len(offers) >= max_offers:
                break
                
            sleep(1)  # Rate limiting between categories
            main_link = li.find('a', recursive=False)
            
            if not main_link:
                continue
            
            category_name = main_link.get_text(strip=True)
            category_url = BASE_URL + main_link.get('href', '')
            
            if print_logs:
                print(f"Scraping category: {category_name} from {category_url}")
            
            try:
                driver.get(category_url)
                sleep(1)
                category_soup = BeautifulSoup(driver.page_source, 'html.parser')
                
                # Find all offer items
                li_offers = category_soup.find_all(
                    "li",
                    class_=lambda x: x and "break-words" in x and "border-t" in x
                )
                
                for offer_li in li_offers:
                    if len(offers) >= max_offers:
                        break
                    
                    # Find the offer link
                    link = offer_li.find("a", class_=lambda x: x and "rounded-2xl" in x)
                    
                    if not link:
                        continue
                    
                    # Skip inactive offers (gray background)
                    link_classes = ' '.join(link.get('class', []))
                    if 'lg:bg-[#FAFAFA]' in link_classes:
                        continue
                    
                    # Extract offer data
                    href = link.get('href', '')
                    offer_url = BASE_URL + href if href else ''
                    
                    # Deduplicate by URL
                    if offer_url in seen_urls:
                        continue
                    seen_urls.add(offer_url)
                    
                    # Title
                    title_elem = link.select_one("h5")
                    title = title_elem.get_text(strip=True) if title_elem else ''
                    
                    # Client name
                    client_elem = link.select_one("div.t-14-medium")
                    client_name = client_elem.get_text(strip=True) if client_elem else ''
                    
                    # Budget
                    budget_elem = link.select_one("div.t-14-medium.leading-4")
                    budget = budget_elem.get_text(strip=True) if budget_elem else ''
                    
                    # Get description from offer details page
                    description = ''
                    try:
                        if print_logs:
                            print(f"  Scraping offer: {title}")
                        
                        driver.get(offer_url)
                        sleep(0.5)
                        
                        offer_details_soup = BeautifulSoup(driver.page_source, 'html.parser')
                        description_elem = offer_details_soup.find(
                            "div",
                            class_=lambda x: x and "t-16-default" in x and "max-w-[44.063rem]" in x and "text-gray-primary" in x
                        )
                        description = description_elem.get_text(strip=True) if description_elem else ''
                        
                        # Go back to category page for next offers
                        driver.get(category_url)
                        sleep(0.5)
                        
                    except Exception as e:
                        if print_logs:
                            print(f"    Error getting description: {e}")
                    
                    offers.append({
                        'title': title,
                        'url': offer_url,
                        'description': description,
                        'budget': budget,
                        'client_name': client_name,
                        'client_location': '',  # Not available on WorkConnect
                        'category': category_name,
                        'platform': PLATFORM,
                    })
                    
            except Exception as e:
                if print_logs:
                    print(f"Error scraping category {category_name}: {e}")
                continue
        
        if print_logs:
            print(f"Scraped {len(offers)} offers from WorkConnect")
        
        return offers
        
    except Exception as e:
        if print_logs:
            print(f"Error during WorkConnect scraping: {e}")
        raise
    finally:
        if driver:
            driver.quit()


def refresh_workconnect_cache(max_offers: int = 50, print_logs: bool = False) -> Dict[str, Any]:
    """
    Refresh WorkConnect cache by clearing old offers and scraping new ones.
    
    Returns:
        Dict with refresh results
    """
    start_time = datetime.utcnow()
    
    try:
        # Clear existing cache
        clear_cached_offers()
        
        # Scrape fresh offers
        offers = scrape_workconnect_offers(max_offers=max_offers, print_logs=print_logs)
        
        # Save to cache
        save_offers_to_cache(offers)
        
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return {
            'success': True,
            'offers_count': len(offers),
            'duration_ms': duration_ms,
            'cached_at': datetime.utcnow().isoformat() + 'Z',
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'offers_count': 0,
            'duration_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000),
        }


def get_workconnect_offers(
    max_offers: int = 50,
    force_refresh: bool = False,
    print_logs: bool = False
) -> Dict[str, Any]:
    """
    Get WorkConnect offers - either from cache or by scraping.
    
    This is the main entry point for getting WorkConnect offers.
    It checks if cache is valid and returns cached offers if so,
    otherwise refreshes the cache first.
    
    Args:
        max_offers: Maximum number of offers to return
        force_refresh: If True, always refresh cache regardless of age
        print_logs: Whether to print progress logs
    
    Returns:
        Dict with offers and metadata
    """
    settings = get_workconnect_settings()
    
    if not settings['enabled']:
        return {
            'success': False,
            'error': 'WorkConnect is disabled',
            'offers': [],
            'from_cache': False,
        }
    
    # Check if we need to refresh cache
    cache_valid = is_cache_valid()
    
    if force_refresh or not cache_valid:
        if print_logs:
            reason = "forced refresh" if force_refresh else "cache expired"
            print(f"Refreshing WorkConnect cache ({reason})")
        
        effective_max = settings['max_offers'] or max_offers
        result = refresh_workconnect_cache(max_offers=effective_max, print_logs=print_logs)
        
        if not result['success']:
            return {
                'success': False,
                'error': result.get('error', 'Unknown error during scraping'),
                'offers': [],
                'from_cache': False,
            }
    
    # Get offers from cache
    offers = get_cached_offers(max_offers=max_offers)
    
    return {
        'success': True,
        'offers': offers,
        'offers_count': len(offers),
        'from_cache': cache_valid and not force_refresh,
    }

