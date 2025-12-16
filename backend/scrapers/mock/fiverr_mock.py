"""
Mock data generator for Fiverr scraper.
Returns sample gig offers for testing.
"""
import random
from typing import List

from scrapers.utils import ScrapedOffer, ScrapeResult


PLATFORM = "fiverr"
BASE_URL = "https://www.fiverr.com"

GIG_TITLES = [
    "I will create a professional website",
    "I will design a modern logo",
    "I will develop a mobile app",
    "I will write SEO content",
    "I will edit your video professionally",
    "I will create custom illustrations",
    "I will do data entry and web research",
    "I will translate documents",
    "I will create social media graphics",
    "I will develop WordPress plugins",
]

DESCRIPTIONS = [
    "Professional service with fast delivery. Unlimited revisions included.",
    "Top-rated seller with 5 years of experience. 100% satisfaction guaranteed.",
    "Quick turnaround and excellent communication. Let's discuss your project!",
    "High-quality work at competitive prices. Portfolio available upon request.",
]

BUDGETS = ["$50", "$100", "$150", "$200", "$300", "$500", "$1,000"]


def generate_fiverr_mock_offers(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    max_offers: int,
    search_url: str,
) -> ScrapeResult:
    """
    Generate mock Fiverr offers for testing.
    
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
        title = random.choice(GIG_TITLES)
        if keywords:
            title = f"{title} - {random.choice(keywords)}"
        
        offers.append(ScrapedOffer(
            title=title,
            description=f"{random.choice(DESCRIPTIONS)} Skills: {keywords_str}.",
            url=f"{BASE_URL}/gig/mock-gig-{i}-{random.randint(1000, 9999)}",
            platform=PLATFORM,
            budget=random.choice(BUDGETS),
            client_name=f"seller_{random.randint(100, 999)}",
            client_location="Worldwide",
            posted_at="2025-12-12T10:00:00.000Z",
            tags=keywords[:5] if keywords else ["freelance"],
        ))
    
    return ScrapeResult(
        offers=offers,
        search_url=search_url,
        duration_millis=random.randint(2000, 5000),
        platform=PLATFORM,
    )

