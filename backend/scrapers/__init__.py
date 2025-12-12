# Scrapers package

from .utils import BaseScraper, ScrapedOffer, ScrapeResult
from .upwork_service import upwork_scraper, UpworkScraper
from .fiverr_service import fiverr_scraper, FiverrScraper
from .justjoinit_service import justjoinit_scraper, JustJoinITScraper
from .contra_service import contra_scraper, ContraScraper
from .useme_service import useme_scraper, UsemeScraper
from .rocketjobs_service import rocketjobs_scraper, RocketJobsScraper

# Registry of all available scrapers (order matters for UI)
SCRAPER_REGISTRY = {
    'upwork': upwork_scraper,
    'justjoinit': justjoinit_scraper,
    'fiverr': fiverr_scraper,
    'contra': contra_scraper,
    'useme': useme_scraper,
    'rocketjobs': rocketjobs_scraper,
}

# Platform display names
PLATFORM_NAMES = {
    'upwork': 'Upwork',
    'justjoinit': 'JustJoinIT',
    'fiverr': 'Fiverr',
    'contra': 'Contra',
    'useme': 'Useme',
    'rocketjobs': 'RocketJobs',
}

def get_scraper(platform: str) -> BaseScraper:
    """Get scraper instance by platform name."""
    if platform not in SCRAPER_REGISTRY:
        raise ValueError(f"Unknown platform: {platform}. Available: {list(SCRAPER_REGISTRY.keys())}")
    return SCRAPER_REGISTRY[platform]

def get_all_scrapers():
    """Get all registered scrapers."""
    return SCRAPER_REGISTRY

def get_platform_name(platform: str) -> str:
    """Get display name for a platform."""
    return PLATFORM_NAMES.get(platform, platform.title())

__all__ = [
    'BaseScraper',
    'ScrapedOffer', 
    'ScrapeResult',
    'UpworkScraper',
    'FiverrScraper',
    'JustJoinITScraper',
    'ContraScraper',
    'UsemeScraper',
    'RocketJobsScraper',
    'upwork_scraper',
    'fiverr_scraper',
    'justjoinit_scraper',
    'contra_scraper',
    'useme_scraper',
    'rocketjobs_scraper',
    'get_scraper',
    'get_all_scrapers',
    'get_platform_name',
    'SCRAPER_REGISTRY',
    'PLATFORM_NAMES',
]
