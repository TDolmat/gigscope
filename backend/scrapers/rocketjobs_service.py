"""
RocketJobs scraper service with real and mock implementations.
"""
import random
from typing import List

from .utils import BaseScraper, ScrapedOffer, ScrapeResult


PLATFORM = "rocketjobs"
SEARCH_URL_BASE = "https://rocketjobs.pl/"


class RocketJobsScraper(BaseScraper):
    """RocketJobs platform scraper (Polish startup job board)"""
    
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
            return f"{SEARCH_URL_BASE}szukaj?keyword={'+'.join(keywords)}"
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
        Real RocketJobs scraping.
        
        TODO: Implement this method when ready for production.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        # TODO: Implement real RocketJobs scraping
        return ScrapeResult(
            offers=[],
            search_url=search_url,
            duration_millis=0,
            platform=PLATFORM,
            error="Real RocketJobs scraping not implemented yet"
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
        Mock RocketJobs scraping for testing.
        Returns sample Polish startup job offers.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        job_titles = [
            "Product Manager w startupie FinTech",
            "Growth Hacker - Marketing Performance",
            "Frontend Developer (React/Vue)",
            "UX/UI Designer - Aplikacje mobilne",
            "Data Analyst - Business Intelligence",
            "Customer Success Manager",
            "Sales Development Representative",
            "Backend Developer (Node.js/Python)",
            "Community Manager",
            "Operations Manager",
            "Content Marketing Specialist",
            "HR Business Partner",
        ]
        
        companies = [
            "Brainly", "Packhelp", "Booksy", "Uncapped", "Zowie",
            "Infermedica", "Growbots", "Brand24", "LiveChat", "Tidio",
            "PandaDoc", "Landingi", "Sotrender", "Survicate"
        ]
        
        locations = ["Warszawa", "Kraków", "Wrocław", "Remote", "Hybrid"]
        salaries = ["8 000 - 12 000 PLN", "12 000 - 18 000 PLN", "15 000 - 25 000 PLN", "20 000 - 30 000 PLN", "Confidential"]
        
        keywords = must_contain + may_contain
        keywords_str = ", ".join(keywords) if keywords else "startup"
        
        offers = []
        for i in range(max_offers):
            title = random.choice(job_titles)
            if keywords:
                if random.random() > 0.5:
                    title = f"{title} - {random.choice(keywords).title()}"
            
            company = random.choice(companies)
            location = random.choice(locations)
            
            offers.append(ScrapedOffer(
                title=title,
                description=f"Dołącz do dynamicznego zespołu w szybko rozwijającym się startupie! "
                           f"Szukamy osoby z doświadczeniem w: {keywords_str}. "
                           f"Oferujemy: equity/ESOP, elastyczne godziny, budżet rozwojowy, integracje zespołowe.",
                url=f"https://rocketjobs.pl/oferta/{company.lower()}-{i}",
                platform=PLATFORM,
                budget=random.choice(salaries),
                client_name=company,
                client_location=location,
                posted_at="2025-12-12T10:00:00.000Z",
                tags=keywords[:5] if keywords else ["startup", "tech"],
            ))
        
        return ScrapeResult(
            offers=offers,
            search_url=search_url,
            duration_millis=random.randint(5000, 15000),
            platform=PLATFORM,
        )


# Singleton instance
rocketjobs_scraper = RocketJobsScraper()

