"""
Fiverr scraper service with real and mock implementations.
"""
import random
from typing import List

from .utils import BaseScraper, ScrapedOffer, ScrapeResult


PLATFORM = "fiverr"
SEARCH_URL_BASE = "https://www.fiverr.com/search/gigs"


class FiverrScraper(BaseScraper):
    """Fiverr platform scraper"""
    
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
        query = " ".join(must_contain + may_contain)
        if query:
            return f"{SEARCH_URL_BASE}?query={query.replace(' ', '%20')}"
        return SEARCH_URL_BASE
    
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
        Real Fiverr scraping.
        
        TODO: Implement this method when ready for production.
        Currently returns empty result - implement with your preferred scraping method.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        # TODO: Implement real Fiverr scraping
        return ScrapeResult(
            offers=[],
            search_url=search_url,
            duration_millis=0,
            platform=PLATFORM,
            error="Real Fiverr scraping not implemented yet"
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
        Mock Fiverr scraping for testing.
        Returns sample buyer request data.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        # Sample Fiverr buyer request titles
        request_titles = [
            "Looking for expert to build custom website",
            "Need mobile app developer for iOS project",
            "Seeking graphic designer for brand identity",
            "Content writer needed for blog articles",
            "Video editor for YouTube channel",
            "Social media manager for e-commerce store",
            "SEO expert to improve website ranking",
            "Virtual assistant for daily tasks",
            "Logo designer for new startup",
            "Data entry specialist needed",
            "Translation services required",
            "Voice over artist for commercial",
        ]
        
        descriptions = [
            "I need a professional to help with my project. Budget is flexible for the right candidate. Please share your portfolio and relevant experience.",
            "Urgent project requiring immediate attention. Looking for someone who can deliver quality work within tight deadlines.",
            "Long-term collaboration opportunity. We have multiple projects lined up and need a reliable partner.",
            "First-time buyer looking for guidance. Please be patient and explain the process clearly.",
            "Repeat project - our previous seller is unavailable. Need someone familiar with similar work.",
        ]
        
        budgets = ["$50-100", "$100-250", "$250-500", "$500-1000", "$1000+", "Contact for price"]
        
        keywords = must_contain + may_contain
        keywords_str = ", ".join(keywords) if keywords else "freelance services"
        
        offers = []
        for i in range(max_offers):
            title = random.choice(request_titles)
            if keywords:
                if random.random() > 0.5:
                    title = f"{title} - {random.choice(keywords).title()}"
            
            offers.append(ScrapedOffer(
                title=f"{title}",
                description=f"{random.choice(descriptions)} Skills needed: {keywords_str}.",
                url=f"https://www.fiverr.com/buyer-requests/{10000 + i}",
                platform=PLATFORM,
                budget=random.choice(budgets),
                client_name=f"buyer_{random.randint(1000, 9999)}",
                posted_at="2025-12-12T10:00:00.000Z",
                tags=keywords[:5] if keywords else ["freelance"],
            ))
        
        return ScrapeResult(
            offers=offers,
            search_url=search_url,
            duration_millis=random.randint(20000, 60000),
            platform=PLATFORM,
        )


# Singleton instance
fiverr_scraper = FiverrScraper()

