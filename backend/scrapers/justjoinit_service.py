"""
JustJoinIT scraper service with real and mock implementations.
"""
import random
from typing import List

from .utils import BaseScraper, ScrapedOffer, ScrapeResult


PLATFORM = "justjoinit"
SEARCH_URL_BASE = "https://justjoin.it/"


class JustJoinITScraper(BaseScraper):
    """JustJoinIT platform scraper"""
    
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
        """Build JustJoinIT search URL."""
        keywords = must_contain + may_contain
        if keywords:
            return f"{SEARCH_URL_BASE}?keyword={'+'.join(keywords)}"
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
        Real JustJoinIT scraping.
        
        TODO: Implement this method when ready for production.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        # TODO: Implement real JustJoinIT scraping
        return ScrapeResult(
            offers=[],
            search_url=search_url,
            duration_millis=0,
            platform=PLATFORM,
            error="Real JustJoinIT scraping not implemented yet"
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
        Mock JustJoinIT scraping for testing.
        Returns sample job offers from Polish IT market.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        job_titles = [
            "Senior Frontend Developer",
            "Backend Engineer (Python/Django)",
            "Full Stack Developer - React/Node",
            "DevOps Engineer - Kubernetes",
            "Mobile Developer - Flutter",
            "Data Engineer - Spark/Airflow",
            "Cloud Architect - AWS",
            "Site Reliability Engineer",
            "Machine Learning Engineer",
            "Security Engineer",
            "Tech Lead - Java/Kotlin",
            "Software Architect",
        ]
        
        companies = [
            "Allegro", "CD Projekt", "Docplanner", "Netguru", "STX Next",
            "Software House", "10Clouds", "Monterail", "Boldare", "Rumble Fish",
            "Grand Parade", "Spyrosoft", "Avenga", "Future Processing"
        ]
        
        locations = ["Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź", "Remote"]
        salaries = ["15 000 - 22 000 PLN", "18 000 - 28 000 PLN", "22 000 - 35 000 PLN", "25 000 - 40 000 PLN", "Undisclosed"]
        
        keywords = must_contain + may_contain
        keywords_str = ", ".join(keywords) if keywords else "software development"
        
        offers = []
        for i in range(max_offers):
            title = random.choice(job_titles)
            if keywords:
                if random.random() > 0.5:
                    title = f"{random.choice(keywords).title()} {title}"
            
            company = random.choice(companies)
            location = random.choice(locations)
            
            offers.append(ScrapedOffer(
                title=title,
                description=f"Poszukujemy doświadczonego specjalisty do pracy nad nowoczesnymi projektami. "
                           f"Technologie: {keywords_str}. Oferujemy elastyczne godziny pracy, prywatną opiekę medyczną, "
                           f"kartę Multisport i możliwość rozwoju w międzynarodowym środowisku.",
                url=f"https://justjoin.it/offers/{company.lower().replace(' ', '-')}-{i}",
                platform=PLATFORM,
                budget=random.choice(salaries),
                client_name=company,
                client_location=location,
                posted_at="2025-12-12T10:00:00.000Z",
                tags=keywords[:5] if keywords else ["IT", "development"],
            ))
        
        return ScrapeResult(
            offers=offers,
            search_url=search_url,
            duration_millis=random.randint(5000, 15000),
            platform=PLATFORM,
        )


# Singleton instance
justjoinit_scraper = JustJoinITScraper()

