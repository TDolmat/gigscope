"""
Mock data generator for Useme scraper.
Returns sample Polish freelance marketplace projects for testing.
"""
import random
from typing import List

from scrapers.utils import ScrapedOffer, ScrapeResult


PLATFORM = "useme"

PROJECT_TITLES = [
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

DESCRIPTIONS = [
    "Szukamy osoby do realizacji projektu. Wymagane portfolio i doświadczenie w podobnych projektach.",
    "Pilne zlecenie z możliwością stałej współpracy. Preferowane osoby z Useme dla bezpieczeństwa płatności.",
    "Projekt dla klienta korporacyjnego. Wymagana pełna dyspozycyjność przez okres realizacji.",
    "Zlecenie z elastycznym terminem. Liczy się jakość wykonania, nie szybkość.",
]

BUDGETS = ["500 - 1000 PLN", "1000 - 2500 PLN", "2500 - 5000 PLN", "5000 - 10000 PLN", "Do ustalenia"]


def generate_useme_mock_offers(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    max_offers: int,
    search_url: str,
) -> ScrapeResult:
    """
    Generate mock Useme offers for testing.
    
    Args:
        must_contain: Keywords that must be in the offer
        may_contain: Keywords that may be in the offer
        must_not_contain: Keywords that must not be in the offer
        max_offers: Maximum number of offers to return
        search_url: The search URL to include in the result
    
    Returns:
        ScrapeResult with mock offers
    """
    keywords = must_contain + may_contain
    keywords_str = ", ".join(keywords) if keywords else "freelance"
    
    offers = []
    for i in range(max_offers):
        title = random.choice(PROJECT_TITLES)
        if keywords:
            if random.random() > 0.5:
                title = f"{title} ({random.choice(keywords)})"
        
        offers.append(ScrapedOffer(
            title=title,
            description=f"{random.choice(DESCRIPTIONS)} Wymagane umiejętności: {keywords_str}. "
                       f"Płatność przez Useme - bezpieczna transakcja.",
            url=f"https://useme.com/pl/jobs/job,{200000 + i}/",
            platform=PLATFORM,
            budget=random.choice(BUDGETS),
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

