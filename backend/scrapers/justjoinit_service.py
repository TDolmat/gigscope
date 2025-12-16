"""
JustJoinIt scraper service with real and mock implementations.
All scraping logic is contained in this single file.
"""
import time
from typing import List, Dict, Any
from urllib.parse import quote

from bs4 import BeautifulSoup

from .utils import BaseScraper, ScrapedOffer, ScrapeResult, make_request
from .utils.keywords_helper import filter_offers, deduplicate_offers
from .mock.justjoinit_mock import generate_justjoinit_mock_offers


PLATFORM = "justjoinit"
BASE_URL = "https://justjoin.it"
SEARCH_URL_BASE = "https://justjoin.it/job-offers/remote?working-hours=freelance&orderBy=DESC&sortBy=published"


class JustJoinITScraper(BaseScraper):
    """JustJoinIt platform scraper (Polish/European IT job board)"""
    
    @property
    def platform_name(self) -> str:
        return PLATFORM
    
    # -------------------------------------------------------------------------
    # URL Building
    # -------------------------------------------------------------------------
    
    def _build_search_url(self, query: str) -> str:
        """Build JustJoinIt search URL. Uses keyword param with comma-separated values."""
        encoded_query = quote(query).replace("%2C", ",").replace("%20", "+")
        return f"{SEARCH_URL_BASE}&keyword={encoded_query}"
    
    def get_search_url(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        **kwargs
    ) -> str:
        """Build JustJoinIt search URL from keyword lists."""
        keywords = must_contain + may_contain
        if keywords:
            query = ", ".join(keywords)
            return self._build_search_url(query)
        return SEARCH_URL_BASE
    
    # -------------------------------------------------------------------------
    # HTML Parsing
    # -------------------------------------------------------------------------
    
    def _parse_offers_from_html(self, html: str) -> List[Dict[str, Any]]:
        """Parse JustJoinIt job listings from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        offer_elements = soup.select('li.MuiBox-root')
        
        offers = []
        for offer_elem in offer_elements:
            # Title
            title_elem = offer_elem.select_one('h3')
            if not title_elem:
                continue
            title = title_elem.get_text(strip=True)
            
            # URL
            url_elem = offer_elem.select_one('a.offer-card')
            if not url_elem:
                continue
            url = BASE_URL + url_elem.get('href', '')
            
            # Budget
            budget_elem = offer_elem.select_one('h6')
            budget = budget_elem.get_text(strip=True) if budget_elem else None
            
            # Company name
            company_elem = offer_elem.select_one('p.MuiTypography-root.MuiTypography-body1')
            client_name = company_elem.get_text(strip=True) if company_elem else None
            
            offers.append({
                'title': title,
                'description': None,  # Description requires loading offer details page
                'url': url,
                'budget': budget,
                'client_name': client_name,
                'client_location': None,
                'platform': PLATFORM,
            })
        
        return offers
    
    def _parse_offer_description(self, html: str) -> str:
        """Parse description from JustJoinIt offer details page."""
        soup = BeautifulSoup(html, 'html.parser')
        description_elem = soup.select_one('div.MuiBox-root.mui-1iv35pp')
        return description_elem.get_text(strip=True) if description_elem else ''
    
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
    
    def _fetch_descriptions_for_offers(self, offers: List[Dict[str, Any]]) -> None:
        """Fetch descriptions from detail pages for a list of offers (in-place)."""
        for offer in offers:
            print(f"Fetching description for offer: {offer.get('url', 'unknown')}")
            detail_response = make_request(
                offer['url'],
                sleep_interval_seconds=1.0,
                max_retries=2,
                backoff_factor=2.0
            )
            if detail_response:
                offer['description'] = self._parse_offer_description(detail_response.content)
    
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
        fetch_descriptions: bool = True,
        **kwargs
    ) -> ScrapeResult:
        """
        Real JustJoinIt scraping.
        
        Search Strategy:
        - must_contain: Single request (platform handles AND logic via comma-separated query)
        - may_contain: Multiple requests (one per keyword), client-side filtering for must_contain
        - must_not_contain: Always filtered client-side
        
        Args:
            must_contain: Keywords that must be in the offer
            may_contain: Keywords that may be in the offer
            must_not_contain: Keywords that must not be in the offer
            max_offers: Maximum number of offers to return
            api_key: Not used for JustJoinIt
            fetch_descriptions: Whether to fetch full descriptions from detail pages (slower)
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
            
            # If no keywords provided, just scrape base URL
            if not must_contain and not may_contain:
                response = make_request(
                    SEARCH_URL_BASE,
                    sleep_interval_seconds=1.0,
                    max_retries=3,
                    backoff_factor=2.0
                )
                if response:
                    offers = self._parse_offers_from_html(response.content)
                    offers = filter_offers(offers, must_not_include=must_not_contain)
                    all_offers.extend(offers)
            
            # Deduplicate and limit FIRST
            all_offers = deduplicate_offers(all_offers)
            limited_offers = all_offers[:max_offers]
            
            # THEN fetch descriptions only for limited offers
            if fetch_descriptions and limited_offers:
                print(f"Fetching descriptions for {len(limited_offers)} offers (limited from {len(all_offers)} total)")
                self._fetch_descriptions_for_offers(limited_offers)
            
            duration_millis = int((time.time() - start_time) * 1000)
            
            # Convert to ScrapedOffer objects
            scraped_offers = []
            for raw in limited_offers:
                scraped_offers.append(ScrapedOffer(
                    title=raw.get('title', ''),
                    description=raw.get('description') or '',
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
        Mock JustJoinIt scraping for testing.
        Returns sample IT job offers.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return generate_justjoinit_mock_offers(
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            max_offers=max_offers,
            search_url=search_url,
        )


# Singleton instance
justjoinit_scraper = JustJoinITScraper()

