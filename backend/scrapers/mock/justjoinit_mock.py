"""
Mock data generator for JustJoinIt scraper.
Returns sample IT job offers for testing.
"""
import random
from typing import List

from scrapers.utils import ScrapedOffer, ScrapeResult


PLATFORM = "justjoinit"

JOB_TITLES = [
    "Senior Python Developer",
    "Full Stack Developer (React + Node)",
    "Java Backend Developer",
    "DevOps Engineer",
    "Frontend Developer (Vue.js)",
    "Data Engineer",
    "Machine Learning Engineer",
    "QA Automation Engineer",
    "iOS Developer (Swift)",
    "Android Developer (Kotlin)",
    "Cloud Architect (AWS)",
    "Blockchain Developer",
]

DESCRIPTIONS = [
    "We are looking for an experienced developer to join our growing team. Remote-first company with flexible hours.",
    "Exciting opportunity to work on cutting-edge technology. Competitive salary and stock options available.",
    "Join our startup and help us build the next generation of our product. Great learning environment.",
    "Work with a team of talented engineers on challenging projects. International team and modern tech stack.",
]

BUDGETS = [
    "15 000 - 20 000 PLN",
    "18 000 - 25 000 PLN",
    "20 000 - 28 000 PLN",
    "25 000 - 35 000 PLN",
    "30 000 - 40 000 PLN",
    "Undisclosed salary",
]

COMPANIES = [
    "TechCorp",
    "InnovateLab",
    "DataDriven",
    "CloudFirst",
    "DevHouse",
    "StartupXYZ",
    "BigTech Poland",
    "SoftwareMasters",
]


def generate_justjoinit_mock_offers(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    max_offers: int,
    search_url: str,
) -> ScrapeResult:
    """
    Generate mock JustJoinIt offers for testing.
    
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
            if random.random() > 0.5:
                title = f"{title} ({random.choice(keywords)})"
        
        company = random.choice(COMPANIES)
        
        offers.append(ScrapedOffer(
            title=title,
            description=f"{random.choice(DESCRIPTIONS)} Required skills: {keywords_str}. "
                       f"B2B or UoP contract available.",
            url=f"https://justjoin.it/offers/{company.lower().replace(' ', '-')}-{i}-{random.randint(1000, 9999)}",
            platform=PLATFORM,
            budget=random.choice(BUDGETS),
            client_name=company,
            client_location="Remote (Poland)",
            posted_at="2025-12-12T10:00:00.000Z",
            tags=keywords[:5] if keywords else ["IT", "remote", "freelance"],
        ))
    
    return ScrapeResult(
        offers=offers,
        search_url=search_url,
        duration_millis=random.randint(3000, 8000),
        platform=PLATFORM,
    )

