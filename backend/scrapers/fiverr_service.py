"""
Fiverr scraper service - stub implementation.
Real scraping not yet implemented.
"""
from typing import List

from .utils import BaseScraper, ScrapeResult
from .mock.fiverr_mock import generate_fiverr_mock_offers


PLATFORM = "fiverr"
BASE_URL = "https://www.fiverr.com"


class FiverrScraper(BaseScraper):
    """Fiverr platform scraper (stub - not yet implemented)"""
    
    @property
    def platform_name(self) -> str:
        return PLATFORM
    
    def get_search_url(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        **kwargs
    ) -> str:
        """Build Fiverr search URL."""
        keywords = must_contain + may_contain
        if keywords:
            query = "+".join(keywords)
            return f"{BASE_URL}/search/gigs?query={query}"
        return f"{BASE_URL}/categories"
    
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
        Real Fiverr scraping - NOT YET IMPLEMENTED.
        Returns empty result with error message.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return ScrapeResult(
            offers=[],
            search_url=search_url,
            duration_millis=0,
            platform=PLATFORM,
            error="Fiverr scraping not yet implemented"
        )
    
    def scrape_mock(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        **kwargs
    ) -> ScrapeResult:
        """Mock Fiverr scraping for testing."""
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return generate_fiverr_mock_offers(
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            max_offers=max_offers,
            search_url=search_url,
        )


# Singleton instance
fiverr_scraper = FiverrScraper()
