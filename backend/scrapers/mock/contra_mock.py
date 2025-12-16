"""
Mock data generator for Contra scraper.
Returns sample freelance project offers for testing.
"""
import random
from typing import List

from scrapers.utils import ScrapedOffer, ScrapeResult


PLATFORM = "contra"
BASE_URL = "https://contra.com"

PROJECT_TITLES = [
    "Design Lead needed for startup",
    "Full-Stack Developer for web app",
    "Content Strategist for brand launch",
    "Product Designer for mobile app",
    "Frontend Engineer for SaaS platform",
    "UX Researcher for user studies",
    "Brand Designer for rebrand project",
    "Motion Designer for marketing videos",
    "Copywriter for website content",
    "Data Analyst for business insights",
]

DESCRIPTIONS = [
    "Looking for talented freelancer. Commission-free platform with direct payments.",
    "Exciting project with growth potential. Looking for creative problem solvers.",
    "Join our team of independents. Flexible schedule and competitive compensation.",
    "Great opportunity to build your portfolio. Long-term collaboration possible.",
]

BUDGETS = ["$1,000 - $2,500", "$2,500 - $5,000", "$5,000 - $10,000", "$10,000+", "Hourly rate"]

COMPANIES = ["TechStartup Inc", "Creative Agency", "Design Studio", "Innovation Lab", "Digital Ventures"]


def generate_contra_mock_offers(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    max_offers: int,
    search_url: str,
) -> ScrapeResult:
    """
    Generate mock Contra offers for testing.
    
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
            title = f"{title} ({random.choice(keywords)})"
        
        offers.append(ScrapedOffer(
            title=title,
            description=f"{random.choice(DESCRIPTIONS)} Skills needed: {keywords_str}.",
            url=f"{BASE_URL}/opportunity/mock-{i}-{random.randint(1000, 9999)}",
            platform=PLATFORM,
            budget=random.choice(BUDGETS),
            client_name=random.choice(COMPANIES),
            client_location="Remote",
            posted_at="2025-12-12T10:00:00.000Z",
            tags=keywords[:5] if keywords else ["freelance", "remote"],
        ))
    
    return ScrapeResult(
        offers=offers,
        search_url=search_url,
        duration_millis=random.randint(2000, 5000),
        platform=PLATFORM,
    )

