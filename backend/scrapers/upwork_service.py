"""
Upwork scraper service with real and mock implementations.
"""
from typing import List
from urllib.parse import quote
from apify_client import ApifyClient

from .utils import BaseScraper, ScrapedOffer, ScrapeResult
from .mock.upwork_mock import generate_upwork_mock_offers


PLATFORM = "upwork"
SEARCH_URL_BASE = "https://www.upwork.com/nx/search/jobs/"
APIFY_ACTOR_ID = "XYTgO05GT5qAoSlxy"

TIMEOUT_SECONDS = 150

class UpworkScraper(BaseScraper):
    """Upwork platform scraper"""
    
    @property
    def platform_name(self) -> str:
        return PLATFORM
    
    def get_search_url(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        per_page: int = 50,
        sort: str = 'recency',
        t: int = 1,
        **kwargs
    ) -> str:
        """Build Upwork search URL with query parameters."""
        search_query = self._build_search_query(must_contain, may_contain, must_not_contain)
        return f"{SEARCH_URL_BASE}?per_page={per_page}&sort={sort}&t={t}&q={search_query}"
    
    def _build_search_query(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str]
    ) -> str:
        """Build the search query string with AND/OR/NOT logic."""
        final_query = ""

        if len(must_contain) > 0:
            if len(must_contain) > 1:
                final_query += "(" + " AND ".join(must_contain) + ")"
            else:
                final_query += must_contain[0]
            
        if len(may_contain) > 0:
            if len(final_query) > 0:
                final_query += " AND "

            if len(may_contain) > 1:
                final_query += "(" + " OR ".join(may_contain) + ")"
            else:
                final_query += may_contain[0]

        if len(must_not_contain) > 0:
            if len(final_query) > 0:
                final_query += " AND NOT "

            if len(must_not_contain) > 1:
                final_query += "(" + " OR ".join(must_not_contain) + ")"
            else:
                final_query += must_not_contain[0]

        return quote(final_query, safe='')
    
    def scrape(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        api_key: str = None,
        print_logs: bool = False,
        **kwargs
    ) -> ScrapeResult:
        """
        Real Upwork scraping using Apify.
        """
        if not api_key:
            return ScrapeResult(
                offers=[],
                search_url="",
                duration_millis=0,
                platform=PLATFORM,
                error="API key is required for real scraping"
            )
        
        per_page = 10 if max_offers <= 10 else 50
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain, per_page=per_page)
        
        try:
            client = ApifyClient(api_key)
            
            run_input = {
                "paymentVerified": False,
                "rawUrl": search_url,
                "maxJobAge": {
                    "value": 24,
                    "unit": "hours"
                },
            }

            if print_logs:
                run = client.actor(APIFY_ACTOR_ID).call(run_input=run_input, timeout_secs=TIMEOUT_SECONDS)
            else:
                run = client.actor(APIFY_ACTOR_ID).start(run_input=run_input, timeout_secs=TIMEOUT_SECONDS)
                run = client.run(run["id"]).wait_for_finish(wait_secs=TIMEOUT_SECONDS+30)

            raw_offers = list(client.dataset(run["defaultDatasetId"]).iterate_items())
            duration_millis = run.get("stats", {}).get("durationMillis", 0) or 0
            
            # Convert to ScrapedOffer objects
            offers = []
            for raw in raw_offers[:max_offers]:
                offers.append(ScrapedOffer(
                    title=raw.get('title', ''),
                    description=raw.get('description', ''),
                    url=raw.get('url', ''),
                    platform=PLATFORM,
                    budget=raw.get('budget'),
                    client_location=raw.get('clientLocation'),
                    posted_at=raw.get('absoluteDate'),
                    tags=raw.get('tags', []),
                ))
            
            return ScrapeResult(
                offers=offers,
                search_url=search_url,
                duration_millis=duration_millis,
                platform=PLATFORM,
            )
            
        except Exception as e:
            return ScrapeResult(
                offers=[],
                search_url=search_url,
                duration_millis=0,
                platform=PLATFORM,
                error=str(e)
            )
    
    def scrape_mock(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        **kwargs
    ) -> ScrapeResult:
        """Mock Upwork scraping for testing."""
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        return generate_upwork_mock_offers(
            must_contain=must_contain,
            may_contain=may_contain,
            must_not_contain=must_not_contain,
            max_offers=max_offers,
            search_url=search_url,
        )


# Singleton instance
upwork_scraper = UpworkScraper()
