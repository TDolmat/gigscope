"""
RocketJobs scraper service - stub implementation.
Real scraping not yet implemented.
"""
from typing import List

from .utils import BaseScraper, ScrapeResult
from .mock.rocketjobs_mock import generate_rocketjobs_mock_offers


PLATFORM = "rocketjobs"
BASE_URL = "https://rocketjobs.pl"


class RocketJobsScraper(BaseScraper):
    """RocketJobs platform scraper (stub - not yet implemented)"""
    
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
        """Build RocketJobs search URL."""
        keywords = must_contain + may_contain
        if keywords:
            query = "+".join(keywords)
            return f"{BASE_URL}/oferty-pracy?keyword={query}"
        return f"{BASE_URL}/oferty-pracy"
    
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
        Real RocketJobs scraping - NOT YET IMPLEMENTED.
        Returns empty result with error message.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return ScrapeResult(
            offers=[],
            search_url=search_url,
            duration_millis=0,
            platform=PLATFORM,
            error="RocketJobs scraping not yet implemented"
        )
    
    def scrape_mock(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        **kwargs
    ) -> ScrapeResult:
        """Mock RocketJobs scraping for testing."""
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return generate_rocketjobs_mock_offers(
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            max_offers=max_offers,
            search_url=search_url,
        )


# Singleton instance
rocketjobs_scraper = RocketJobsScraper()
