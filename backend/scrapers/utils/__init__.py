# Scraper utilities package

from .base_scraper import BaseScraper, ScrapedOffer, ScrapeResult, make_request
from .keywords_helper import parse_keywords, filter_offers, deduplicate_offers

__all__ = [
    'BaseScraper',
    'ScrapedOffer',
    'ScrapeResult',
    'make_request',
    'parse_keywords',
    'filter_offers',
    'deduplicate_offers',
]
