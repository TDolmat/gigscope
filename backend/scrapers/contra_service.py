"""
Contra scraper service - stub implementation.
Real scraping not yet implemented.
"""
from typing import List

from .utils import BaseScraper, ScrapeResult
from .mock.contra_mock import generate_contra_mock_offers


PLATFORM = "contra"
BASE_URL = "https://contra.com"


class ContraScraper(BaseScraper):
    """Contra platform scraper (stub - not yet implemented)"""
    
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
        """Build Contra search URL."""
        keywords = must_contain + may_contain
        if keywords:
            query = "+".join(keywords)
            return f"{BASE_URL}/search?q={query}"
        return f"{BASE_URL}/opportunities"
    
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
        Real Contra scraping - NOT YET IMPLEMENTED.
        Returns empty result with error message.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return ScrapeResult(
            offers=[],
            search_url=search_url,
            duration_millis=0,
            platform=PLATFORM,
            error="Contra scraping not yet implemented"
        )
    
    def scrape_mock(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        **kwargs
    ) -> ScrapeResult:
        """Mock Contra scraping for testing."""
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return generate_contra_mock_offers(
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            max_offers=max_offers,
            search_url=search_url,
        )


# Singleton instance
contra_scraper = ContraScraper()
