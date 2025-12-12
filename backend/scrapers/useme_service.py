"""
Useme scraper service with real and mock implementations.
"""
import random
import time
from typing import List

from .utils import BaseScraper, ScrapedOffer, ScrapeResult
from .logic import UsemeScraperLogic


PLATFORM = "useme"
SEARCH_URL_BASE = "https://useme.com/pl/jobs/"


class UsemeScraper(BaseScraper):
    """Useme platform scraper (Polish freelance marketplace)"""
    
    def __init__(self):
        self._scraper_logic = UsemeScraperLogic()
    
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
        """Build Useme search URL."""
        keywords = must_contain + may_contain
        if keywords:
            query = ", ".join(keywords)
            return self._scraper_logic.build_search_url(query)
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
        Real Useme scraping using KeywordScraper logic.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        start_time = time.time()
        
        try:
            # Convert lists to comma-separated strings for KeywordScraper
            must_include_str = ", ".join(must_contain) if must_contain else ""
            may_include_str = ", ".join(may_contain) if may_contain else ""
            must_not_include_str = ", ".join(must_not_contain) if must_not_contain else ""
            
            # Use the scraper logic to get raw offers
            raw_offers = self._scraper_logic.scrape(
                must_include_keywords=must_include_str,
                may_include_keywords=may_include_str,
                must_not_include_keywords=must_not_include_str
            )
            
            duration_millis = int((time.time() - start_time) * 1000)
            
            # Convert to ScrapedOffer objects
            offers = []
            for raw in raw_offers[:max_offers]:
                offers.append(ScrapedOffer(
                    title=raw.get('title', ''),
                    description=raw.get('description', ''),
                    url=raw.get('url', ''),
                    platform=PLATFORM,
                    budget=raw.get('budget'),
                    client_name=raw.get('client_name'),
                    client_location=raw.get('client_location'),
                ))
            
            return ScrapeResult(
                offers=offers,
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
    
    def scrape_mock(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        **kwargs
    ) -> ScrapeResult:
        """
        Mock Useme scraping for testing.
        Returns sample Polish freelance marketplace projects.
        """
        search_url = self.get_search_url(must_contain, may_contain, must_not_contain)
        
        project_titles = [
            "Wykonanie strony internetowej dla firmy",
            "Projekt graficzny logo i wizytówek",
            "Tłumaczenie dokumentów angielski-polski",
            "Stworzenie aplikacji mobilnej",
            "Prowadzenie kampanii Google Ads",
            "Pisanie artykułów na blog firmowy",
            "Obsługa social media",
            "Montaż filmów promocyjnych",
            "Projektowanie UX/UI aplikacji webowej",
            "Programowanie wtyczki WordPress",
            "Administracja serwerem Linux",
            "Tworzenie contentu video na TikTok",
        ]
        
        descriptions = [
            "Szukamy osoby do realizacji projektu. Wymagane portfolio i doświadczenie w podobnych projektach.",
            "Pilne zlecenie z możliwością stałej współpracy. Preferowane osoby z Useme dla bezpieczeństwa płatności.",
            "Projekt dla klienta korporacyjnego. Wymagana pełna dyspozycyjność przez okres realizacji.",
            "Zlecenie z elastycznym terminem. Liczy się jakość wykonania, nie szybkość.",
        ]
        
        budgets = ["500 - 1000 PLN", "1000 - 2500 PLN", "2500 - 5000 PLN", "5000 - 10000 PLN", "Do ustalenia"]
        
        keywords = must_contain + may_contain
        keywords_str = ", ".join(keywords) if keywords else "freelance"
        
        offers = []
        for i in range(max_offers):
            title = random.choice(project_titles)
            if keywords:
                if random.random() > 0.5:
                    title = f"{title} ({random.choice(keywords)})"
            
            offers.append(ScrapedOffer(
                title=title,
                description=f"{random.choice(descriptions)} Wymagane umiejętności: {keywords_str}. "
                           f"Płatność przez Useme - bezpieczna transakcja.",
                url=f"https://useme.com/pl/jobs/job,{200000 + i}/",
                platform=PLATFORM,
                budget=random.choice(budgets),
                client_name=f"Zleceniodawca {random.randint(100, 999)}",
                client_location="Polska",
                posted_at="2025-12-12T10:00:00.000Z",
                tags=keywords[:5] if keywords else ["freelance", "zlecenie"],
            ))
        
        return ScrapeResult(
            offers=offers,
            search_url=search_url,
            duration_millis=random.randint(5000, 12000),
            platform=PLATFORM,
        )


# Singleton instance
useme_scraper = UsemeScraper()
