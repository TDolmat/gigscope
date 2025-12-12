"""
Contra scraper service with real and mock implementations.
"""
import random
from typing import List

from .utils import BaseScraper, ScrapedOffer, ScrapeResult


PLATFORM = "contra"
SEARCH_URL_BASE = "https://contra.com/explore"


class ContraScraper(BaseScraper):
    """Contra platform scraper"""
    
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
            return f"{SEARCH_URL_BASE}?q={'+'.join(keywords)}"
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
        Real Contra scraping.
        
        TODO: Implement this method when ready for production.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        # TODO: Implement real Contra scraping
        return ScrapeResult(
            offers=[],
            search_url=search_url,
            duration_millis=0,
            platform=PLATFORM,
            error="Real Contra scraping not implemented yet"
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
        Mock Contra scraping for testing.
        Returns sample freelance projects.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        project_titles = [
            "Build Landing Page for SaaS Startup",
            "Mobile App UI/UX Design",
            "E-commerce Website Development",
            "Brand Identity Design Package",
            "API Integration and Development",
            "Social Media Marketing Strategy",
            "Product Photography for Online Store",
            "WordPress Site Customization",
            "Motion Graphics for Product Video",
            "SEO Audit and Optimization",
            "Custom CRM Development",
            "Podcast Production and Editing",
        ]
        
        descriptions = [
            "Looking for a talented professional to help bring our vision to life. Commission-free platform means you keep 100% of your earnings.",
            "Exciting project with a growing startup. We value creativity and attention to detail. Quick turnaround expected.",
            "Long-term collaboration opportunity with potential for recurring work. Portfolio review required.",
            "Flexible timeline but quality is paramount. We're looking for someone who can take ownership of the project.",
        ]
        
        budgets = ["$500 - $1,000", "$1,000 - $2,500", "$2,500 - $5,000", "$5,000+", "Negotiable"]
        
        keywords = must_contain + may_contain
        keywords_str = ", ".join(keywords) if keywords else "freelance"
        
        offers = []
        for i in range(max_offers):
            title = random.choice(project_titles)
            if keywords:
                if random.random() > 0.5:
                    title = f"{random.choice(keywords).title()} - {title}"
            
            offers.append(ScrapedOffer(
                title=title,
                description=f"{random.choice(descriptions)} Skills needed: {keywords_str}. "
                           f"This is a commission-free opportunity on Contra.",
                url=f"https://contra.com/opportunity/{100000 + i}",
                platform=PLATFORM,
                budget=random.choice(budgets),
                client_name=f"Client {random.randint(1000, 9999)}",
                client_location="Remote",
                posted_at="2025-12-12T10:00:00.000Z",
                tags=keywords[:5] if keywords else ["freelance", "contract"],
            ))
        
        return ScrapeResult(
            offers=offers,
            search_url=search_url,
            duration_millis=random.randint(8000, 20000),
            platform=PLATFORM,
        )


# Singleton instance
contra_scraper = ContraScraper()

