"""
Mock data generator for RocketJobs scraper.
Returns sample Polish IT job offers for testing.
"""
import random
from typing import List

from scrapers.utils import ScrapedOffer, ScrapeResult


PLATFORM = "rocketjobs"
BASE_URL = "https://rocketjobs.pl"

JOB_TITLES = [
    "Senior Backend Developer",
    "Frontend Developer React",
    "DevOps Engineer",
    "Data Analyst",
    "Product Manager",
    "UX/UI Designer",
    "QA Engineer",
    "Scrum Master",
    "Mobile Developer",
    "Cloud Architect",
]

DESCRIPTIONS = [
    "Poszukujemy specjalisty do dynamicznego zespołu. Praca zdalna możliwa.",
    "Dołącz do naszego zespołu i rozwijaj się w międzynarodowym środowisku.",
    "Oferujemy atrakcyjne wynagrodzenie i pakiet benefitów. Elastyczne godziny pracy.",
    "Szukamy osoby z pasją do technologii. Możliwość rozwoju i awansu.",
]

BUDGETS = [
    "12 000 - 18 000 PLN",
    "15 000 - 22 000 PLN",
    "20 000 - 28 000 PLN",
    "25 000 - 35 000 PLN",
    "30 000 - 40 000 PLN",
]

COMPANIES = [
    "TechStartup",
    "SoftwareHouse",
    "FinTech Sp. z o.o.",
    "E-commerce S.A.",
    "Digital Agency",
    "IT Solutions",
    "Cloud Services",
]

LOCATIONS = ["Warszawa", "Kraków", "Wrocław", "Gdańsk", "Poznań", "Remote"]


def generate_rocketjobs_mock_offers(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    max_offers: int,
    search_url: str,
) -> ScrapeResult:
    """
    Generate mock RocketJobs offers for testing.
    
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
    keywords_str = ", ".join(keywords) if keywords else "IT"
    
    offers = []
    for i in range(max_offers):
        title = random.choice(JOB_TITLES)
        if keywords:
            title = f"{title} ({random.choice(keywords)})"
        
        offers.append(ScrapedOffer(
            title=title,
            description=f"{random.choice(DESCRIPTIONS)} Wymagane umiejętności: {keywords_str}.",
            url=f"{BASE_URL}/oferta/mock-{i}-{random.randint(1000, 9999)}",
            platform=PLATFORM,
            budget=random.choice(BUDGETS),
            client_name=random.choice(COMPANIES),
            client_location=random.choice(LOCATIONS),
            posted_at="2025-12-12T10:00:00.000Z",
            tags=keywords[:5] if keywords else ["IT", "praca"],
        ))
    
    return ScrapeResult(
        offers=offers,
        search_url=search_url,
        duration_millis=random.randint(2000, 5000),
        platform=PLATFORM,
    )

