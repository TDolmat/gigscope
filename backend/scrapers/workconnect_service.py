"""
WorkConnect scraper service with real and mock implementations.
Uses cached offers from the database (refreshed periodically).
All scraping logic is in services/workconnect_service.py.
"""
import time
from typing import List

from .utils import BaseScraper, ScrapedOffer, ScrapeResult
from .utils.keywords_helper import filter_offers, deduplicate_offers
from .mock.workconnect_mock import generate_workconnect_mock_offers


PLATFORM = "workconnect"
BASE_URL = "https://www.workconnect.app"
SEARCH_URL_BASE = "https://www.workconnect.app/zlecenia"


class WorkConnectScraper(BaseScraper):
    """WorkConnect platform scraper (Polish freelance marketplace)"""
    
    @property
    def platform_name(self) -> str:
        return PLATFORM
    
    # -------------------------------------------------------------------------
    # URL Building
    # -------------------------------------------------------------------------
    
    def get_search_url(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        **kwargs
    ) -> str:
        """Build WorkConnect search URL (main page, no query params)."""
        return SEARCH_URL_BASE
    
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
        print_logs: bool = True,
        **kwargs
    ) -> ScrapeResult:
        """
        Real WorkConnect scraping.
        
        Gets offers from cache (which is refreshed periodically by the service).
        Then filters them based on keywords.
        """
        # Import here to avoid circular imports
        from services.workconnect_service import get_workconnect_offers
        from core.models import AppSettings
        
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        start_time = time.time()
        
        try:
            # Get settings for max_offers
            settings = AppSettings.query.first()
            effective_max = (settings.workconnect_max_offers if settings and settings.workconnect_max_offers else 50)
            
            # Get offers from cache (or refresh if needed)
            result = get_workconnect_offers(
                max_offers=effective_max,
                force_refresh=False,
                print_logs=print_logs
            )
            
            if not result['success']:
                duration_millis = int((time.time() - start_time) * 1000)
                return ScrapeResult(
                    offers=[],
                    search_url=search_url,
                    duration_millis=duration_millis,
                    platform=PLATFORM,
                    error=result.get('error', 'Unknown error')
                )
            
            all_offers = result['offers']
            
            # Apply keyword filtering:
            # - must_contain: ALL must be present in title or description
            # - may_contain: At least ONE must be present (only if must_contain is empty)
            # - must_not_contain: NONE should be present
            filtered_offers = filter_offers(
                all_offers,
                must_include=must_contain,
                may_include=may_contain,
                must_not_include=must_not_contain
            )
            
            # Deduplicate and limit
            filtered_offers = deduplicate_offers(filtered_offers)
            
            duration_millis = int((time.time() - start_time) * 1000)
            
            # Convert to ScrapedOffer objects
            scraped_offers = []
            for raw in filtered_offers[:max_offers]:
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
        Mock WorkConnect scraping for testing.
        Returns sample Polish freelance marketplace projects.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return generate_workconnect_mock_offers(
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            max_offers=max_offers,
            search_url=search_url,
        )


# Singleton instance
workconnect_scraper = WorkConnectScraper()

