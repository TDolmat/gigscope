"""
Useme scraper service with real and mock implementations.
All scraping logic is contained in this single file.
"""
import time
import requests
from typing import List, Dict, Any
from urllib.parse import urljoin, quote

from bs4 import BeautifulSoup

from .utils import BaseScraper, ScrapedOffer, ScrapeResult, make_request
from .utils.keywords_helper import parse_keywords, filter_offers, deduplicate_offers
from .mock.useme_mock import generate_useme_mock_offers


PLATFORM = "useme"
BASE_URL = "https://useme.com"
SEARCH_URL_BASE = "https://useme.com/pl/jobs/"

class UsemeScraper(BaseScraper):
    """Useme platform scraper (Polish freelance marketplace)"""
    
    @property
    def platform_name(self) -> str:
        return PLATFORM
    
    # -------------------------------------------------------------------------
    # URL Building
    # -------------------------------------------------------------------------
    
    def _build_search_url(self, query: str) -> str:
        """Build Useme search URL. Uses query param with + for spaces."""
        encoded_query = quote(query).replace("%20", "+")
        return f"{SEARCH_URL_BASE}?query={encoded_query}"
    
    def get_search_url(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        **kwargs
    ) -> str:
        """Build Useme search URL from keyword lists."""
        keywords = must_contain + may_contain
        if keywords:
            query = ", ".join(keywords)
            return self._build_search_url(query)
        return SEARCH_URL_BASE
    
    # -------------------------------------------------------------------------
    # HTML Parsing
    # -------------------------------------------------------------------------
    
    def _parse_offers_from_html(self, html: str) -> List[Dict[str, Any]]:
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
            url = urljoin(BASE_URL, title_elem.get('href', ''))
            
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
                'platform': PLATFORM,
            })
        
        return offers
    
    # -------------------------------------------------------------------------
    # Raw Scraping (single query)
    # -------------------------------------------------------------------------
    
    def _scrape_raw(self, query: str) -> List[Dict[str, Any]]:
        """Scrape offers for a query without any filtering."""
        url = self._build_search_url(query)
        print(f"Scraping URL: {url}")
        
        response = make_request(
            url, 
            sleep_interval_seconds=1.0,
            max_retries=3,
            backoff_factor=2.0
        )
        
        if response is None:
            print(f"Failed to fetch {url} after all retries")
            return []
            
        return self._parse_offers_from_html(response.content)
    
    # -------------------------------------------------------------------------
    # Main Scrape Method
    # -------------------------------------------------------------------------
    
    def scrape(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        api_key: str = None,
        **kwargs
    ) -> ScrapeResult:
        """
        Real Useme scraping.
        
        Search Strategy:
        - must_contain: Single request (platform handles AND logic via comma-separated query)
        - may_contain: Multiple requests (one per keyword), client-side filtering for must_contain
        - must_not_contain: Always filtered client-side
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        start_time = time.time()
        
        try:
            all_offers = []
            
            # Path 1: must_contain - single request, platform handles AND
            if must_contain:
                query = ", ".join(must_contain)
                offers = self._scrape_raw(query)
                # Only filter out must_not_contain
                offers = filter_offers(offers, must_not_include=must_not_contain)
                all_offers.extend(offers)
            
            # Path 2: may_contain - multiple requests, client-side filtering for must_contain
            for keyword in may_contain:
                offers = self._scrape_raw(keyword)
                # Filter for must_contain AND must_not_contain
                offers = filter_offers(offers, must_include=must_contain, must_not_include=must_not_contain)
                all_offers.extend(offers)
            
            # Deduplicate and limit
            all_offers = deduplicate_offers(all_offers)
            
            duration_millis = int((time.time() - start_time) * 1000)
            
            # Convert to ScrapedOffer objects
            scraped_offers = []
            for raw in all_offers[:max_offers]:
                scraped_offers.append(ScrapedOffer(
                    title=raw.get('title', ''),
                    description=raw.get('description', ''),
                    url=raw.get('url', ''),
                    platform=PLATFORM,
                    budget=raw.get('budget'),
                    client_name=raw.get('client_name'),
                    client_location=raw.get('client_location'),
                ))
            
            return ScrapeResult(
                offers=scraped_offers,
                search_url=search_url,
                duration_millis=duration_millis,
                platform=PLATFORM,
            )
            
        except Exception as e:
            duration_millis = int((time.time() - start_time) * 1000)
            return ScrapeResult(
                offers=[],
                search_url=search_url,
                duration_millis=duration_millis,
                platform=PLATFORM,
                error=str(e)
            )
    
    # -------------------------------------------------------------------------
    # Mock Scrape (for testing)
    # -------------------------------------------------------------------------
    
    def scrape_mock(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        **kwargs
    ) -> ScrapeResult:
        """
        Mock Useme scraping for testing.
        Returns sample Polish freelance marketplace projects.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return generate_useme_mock_offers(
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            max_offers=max_offers,
            search_url=search_url,
        )


# Singleton instance
useme_scraper = UsemeScraper()
