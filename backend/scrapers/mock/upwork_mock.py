"""
Mock data generator for Upwork scraper.
Returns sample freelance job offers for testing.
"""
import random
from typing import List

from scrapers.utils import ScrapedOffer, ScrapeResult


PLATFORM = "upwork"

JOB_TITLES = [
    "Senior React Developer for E-commerce Platform",
    "Full Stack Engineer - Node.js & React",
    "Frontend Developer with TypeScript Experience",
    "Python Backend Developer for Data Processing",
    "Mobile App Developer - React Native",
    "DevOps Engineer for Cloud Infrastructure",
    "UI/UX Designer with Figma Skills",
    "WordPress Developer for Blog Migration",
    "Machine Learning Engineer for NLP Project",
    "Blockchain Developer - Smart Contracts",
    "QA Engineer for Automated Testing",
    "Database Administrator - PostgreSQL",
]

DESCRIPTIONS = [
    "We are looking for an experienced developer to join our growing team. The ideal candidate will have 3+ years of experience and excellent communication skills.",
    "Exciting opportunity to work on cutting-edge technology. Remote-friendly position with flexible hours. Must be available for weekly sync meetings.",
    "Join our startup and help build the next big thing. We offer competitive rates and the chance to work with a talented international team.",
    "Long-term project with potential for ongoing work. Looking for someone reliable and detail-oriented who can deliver high-quality code.",
    "Fast-paced environment seeking a skilled professional. You'll be working directly with the CTO to implement new features.",
]

BUDGETS = ["$500", "$1,000", "$2,500", "$5,000", "$50/hr", "$75/hr", "$100/hr", "Negotiable"]

LOCATIONS = ["United States", "United Kingdom", "Germany", "Canada", "Australia", "Netherlands", "Denmark", "Sweden"]


def generate_upwork_mock_offers(
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    max_offers: int,
    search_url: str,
) -> ScrapeResult:
    """
    Generate mock Upwork offers for testing.
    
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
    keywords_str = ", ".join(keywords) if keywords else "software development"
    
    offers = []
    for i in range(max_offers):
        title = random.choice(JOB_TITLES)
        if keywords:
            if random.random() > 0.5:
                title = f"{random.choice(keywords).title()} - {title}"
        
        offers.append(ScrapedOffer(
            title=f"{title} #{i+1}",
            description=f"{random.choice(DESCRIPTIONS)} Required skills: {keywords_str}.",
            url=f"https://www.upwork.com/jobs/~0{1990000000000000000 + i}",
            platform=PLATFORM,
            budget=random.choice(BUDGETS),
            client_location=random.choice(LOCATIONS),
            posted_at="2025-12-12T10:00:00.000Z",
            tags=keywords[:5] if keywords else ["development", "software"],
        ))
    
    return ScrapeResult(
        offers=offers,
        search_url=search_url,
        duration_millis=random.randint(30000, 90000),
        platform=PLATFORM,
    )

