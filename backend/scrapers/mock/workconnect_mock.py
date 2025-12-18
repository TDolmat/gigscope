"""
Mock data generator for WorkConnect scraper.
Returns sample Polish freelance marketplace projects for testing.
"""
import random
from typing import List

from scrapers.utils import ScrapedOffer, ScrapeResult


PLATFORM = "workconnect"

PROJECT_TITLES = [
    "Zlecę stworzenie strony internetowej",
    "Projekt graficzny logo firmy",
    "Aplikacja mobilna dla restauracji",
    "Prowadzenie social media przez 3 miesiące",
    "Tłumaczenie dokumentacji technicznej",
    "Wdrożenie systemu CRM",
    "Optymalizacja SEO strony firmowej",
    "Produkcja filmu promocyjnego",
    "Projektowanie UX/UI aplikacji webowej",
    "Tworzenie contentu na Instagram",
    "Zlecę zaprojektowanie interaktywnej kartki",
    "Model 3D budynku w ArchiCAD",
    "Kalendarz ścienny firmowy",
    "Projekt graficzny wizytówek",
    "Stworzenie sklepu internetowego",
]

DESCRIPTIONS = [
    "Szukamy doświadczonego wykonawcy do realizacji projektu. Wymagane portfolio i wcześniejsze realizacje.",
    "Pilne zlecenie z możliwością stałej współpracy. Preferowane osoby z doświadczeniem w branży.",
    "Projekt dla klienta korporacyjnego. Wymagana pełna dyspozycyjność przez okres realizacji.",
    "Zlecenie z elastycznym terminem wykonania. Liczy się jakość, nie szybkość realizacji.",
    "Potrzebujemy kreatywnej osoby z pomysłami. Mile widziane nieszablonowe podejście.",
    "Zlecenie długoterminowe z możliwością przedłużenia współpracy. Stałe wynagrodzenie.",
]

BUDGETS = [
    "500 - 1000 PLN",
    "1000 - 2500 PLN", 
    "2500 - 5000 PLN",
    "5000 - 10000 PLN",
    "10000 - 20000 PLN",
    "Nie podano",
    "Do ustalenia",
]

CLIENT_NAMES = [
    "MAGTRANS",
    "Investment Apartment",
    "EMED SP. Z O.O. SP. K.",
    "Tech Solutions Sp. z o.o.",
    "Digital Agency",
    "Creative Studio",
    "Marketing Pro",
    "Design House",
]

CATEGORIES = [
    "Projektowanie i Kreatywność",
    "Marketing i Social Media",
    "Programowanie i IT",
    "Pisanie i Tłumaczenia",
    "Biznes i Konsulting",
    "Video i Animacja",
]


def generate_workconnect_mock_offers(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    max_offers: int,
    search_url: str,
) -> ScrapeResult:
    """
    Generate mock WorkConnect offers for testing.
    
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
        
        category = random.choice(CATEGORIES)
        
        offers.append(ScrapedOffer(
            title=title,
            description=f"{random.choice(DESCRIPTIONS)} Szukamy kogoś kto zna się na: {keywords_str}.",
            url=f"https://www.workconnect.app/zlecenie/mock-offer-{10000 + i}",
            platform=PLATFORM,
            budget=random.choice(BUDGETS),
            client_name=random.choice(CLIENT_NAMES),
            client_location="Polska",
            posted_at="2025-12-18T10:00:00.000Z",
            tags=[category] + (keywords[:3] if keywords else ["freelance"]),
        ))
    
    return ScrapeResult(
        offers=offers,
        search_url=search_url,
        duration_millis=random.randint(100, 500),  # Mock is fast
        platform=PLATFORM,
    )

