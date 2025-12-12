"""
Useme.com scraper logic using the KeywordScraper base class.
Handles URL building and HTML parsing for Useme platform.
"""

from bs4 import BeautifulSoup
from urllib.parse import urljoin, quote

from scrapers.utils import KeywordScraper


class UsemeScraperLogic(KeywordScraper):
    """Useme.com scraper implementation."""
    
    BASE_URL = "https://useme.com"
    SEARCH_URL = "https://useme.com/pl/jobs/"
    
    @property
    def platform_name(self) -> str:
        return "useme"
    
    def build_search_url(self, query: str) -> str:
        """Useme uses query param with + for spaces."""
        encoded_query = quote(query).replace("%20", "+")
        return f"{self.SEARCH_URL}?query={encoded_query}"
    
    def parse_offers_from_html(self, html: str) -> list:
        """Parse Useme job listings from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        offer_elements = soup.select('article.job')
        
        offers = []
        for offer_elem in offer_elements:
            # Skip closed offers
            if offer_elem.select_one('a.job__title-link--closed'):
                continue
            
            # Title and URL
            title_elem = offer_elem.select_one('a.job__title')
            if not title_elem:
                continue
            
            title = title_elem.get_text(strip=True)
            url = urljoin(self.BASE_URL, title_elem.get('href', ''))
            
            # Description
            desc_elem = offer_elem.select_one('p')
            description = desc_elem.get_text(strip=True) if desc_elem else None
            
            # Budget
            budget_elem = offer_elem.select_one('div.job__budget span.job__budget-value')
            budget = budget_elem.get_text(strip=True) if budget_elem else None
            
            # Client name
            client_elem = offer_elem.select_one('div.job__employer a, div.job__employer span')
            client_name = client_elem.get_text(strip=True) if client_elem else None
            
            # Client location
            location_elem = offer_elem.select_one('div.job__location')
            client_location = location_elem.get_text(strip=True) if location_elem else None
            
            offers.append({
                'title': title,
                'description': description,
                'url': url,
                'budget': budget,
                'client_name': client_name,
                'client_location': client_location,
            })
        
        return offers

