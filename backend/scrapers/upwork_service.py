"""
Upwork scraper service with real and mock implementations.
"""
import random
from typing import List
from urllib.parse import quote
from apify_client import ApifyClient

from .utils import BaseScraper, ScrapedOffer, ScrapeResult


PLATFORM = "upwork"
SEARCH_URL_BASE = "https://www.upwork.com/nx/search/jobs/"
APIFY_ACTOR_ID = "XYTgO05GT5qAoSlxy"


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
        
        TODO: Implement this method when ready for production.
        Currently raises NotImplementedError.
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
            }

            if print_logs:
                run = client.actor(APIFY_ACTOR_ID).call(run_input=run_input)
            else:
                run = client.actor(APIFY_ACTOR_ID).start(run_input=run_input)
                run = client.run(run["id"]).wait_for_finish()

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
        """
        Mock Upwork scraping for testing.
        Returns sample data without making API calls.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        # Sample job titles for more realistic mock data
        job_titles = [
            "Senior React Developer for E-commerce Platform",
            "Full Stack Engineer - Node.js & React",
            "Frontend Developer with TypeScript Experience",
            "Python Backend Developer for Data Processing",
            "Mobile App Developer - React Native",
            "DevOps Engineer for Cloud Infrastructure",
            "UI/UX Designer with Figma Skills",
            "WordPress Developer for Blog Migration",
            "Machine Learning Engineer for NLP Project",
            "Blockchain Developer - Smart Contracts",
            "QA Engineer for Automated Testing",
            "Database Administrator - PostgreSQL",
        ]
        
        descriptions = [
            "We are looking for an experienced developer to join our growing team. The ideal candidate will have 3+ years of experience and excellent communication skills.",
            "Exciting opportunity to work on cutting-edge technology. Remote-friendly position with flexible hours. Must be available for weekly sync meetings.",
            "Join our startup and help build the next big thing. We offer competitive rates and the chance to work with a talented international team.",
            "Long-term project with potential for ongoing work. Looking for someone reliable and detail-oriented who can deliver high-quality code.",
            "Fast-paced environment seeking a skilled professional. You'll be working directly with the CTO to implement new features.",
        ]
        
        budgets = ["$500", "$1,000", "$2,500", "$5,000", "$50/hr", "$75/hr", "$100/hr", "Negotiable"]
        locations = ["United States", "United Kingdom", "Germany", "Canada", "Australia", "Netherlands", "Denmark", "Sweden"]
        
        # Build keywords string for descriptions
        keywords = must_contain + may_contain
        keywords_str = ", ".join(keywords) if keywords else "software development"
        
        offers = []
        for i in range(max_offers):
            title = random.choice(job_titles)
            if keywords:
                # Add a random keyword to title sometimes
                if random.random() > 0.5:
                    title = f"{random.choice(keywords).title()} - {title}"
            
            offers.append(ScrapedOffer(
                title=f"{title} #{i+1}",
                description=f"{random.choice(descriptions)} Required skills: {keywords_str}.",
                url=f"https://www.upwork.com/jobs/~0{1990000000000000000 + i}",
                platform=PLATFORM,
                budget=random.choice(budgets),
                client_location=random.choice(locations),
                posted_at="2025-12-12T10:00:00.000Z",
                tags=keywords[:5] if keywords else ["development", "software"],
            ))
        
        return ScrapeResult(
            offers=offers,
            search_url=search_url,
            duration_millis=random.randint(30000, 90000),  # Simulated 30-90 seconds
            platform=PLATFORM,
        )


# Singleton instance
upwork_scraper = UpworkScraper()

