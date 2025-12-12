"""
Base scraper interface that all platform scrapers must implement.
Each platform scraper should provide both real and mock implementations.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class ScrapedOffer:
    """Standardized offer data structure from any platform"""
    title: str
    description: str
    url: str
    platform: str
    budget: str = None
    client_name: str = None
    client_location: str = None
    posted_at: str = None
    tags: List[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'title': self.title,
            'description': self.description,
            'url': self.url,
            'platform': self.platform,
            'budget': self.budget,
            'client_name': self.client_name,
            'client_location': self.client_location,
            'posted_at': self.posted_at,
            'tags': self.tags or [],
        }


@dataclass
class ScrapeResult:
    """Result from a scraping operation"""
    offers: List[ScrapedOffer]
    search_url: str
    duration_millis: int
    platform: str
    error: str = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'offers': [o.to_dict() for o in self.offers],
            'search_url': self.search_url,
            'duration_millis': self.duration_millis,
            'platform': self.platform,
            'count': len(self.offers),
            'error': self.error,
        }


class BaseScraper(ABC):
    """Abstract base class for platform scrapers"""
    
    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Return the platform identifier (e.g., 'upwork', 'fiverr')"""
        pass
    
    @abstractmethod
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
        Real scraping implementation.
        Should be implemented by each platform scraper.
        
        Args:
            must_contain: Keywords that must be in the offer
            may_contain: Keywords that may be in the offer
            must_not_contain: Keywords that must not be in the offer
            max_offers: Maximum number of offers to return
            api_key: API key for the scraping service (if needed)
            
        Returns:
            ScrapeResult with the scraped offers
        """
        pass
    
    @abstractmethod
    def scrape_mock(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        max_offers: int = 10,
        **kwargs
    ) -> ScrapeResult:
        """
        Mock scraping implementation for testing.
        Returns sample/fake data without making real API calls.
        
        Args:
            must_contain: Keywords that must be in the offer
            may_contain: Keywords that may be in the offer  
            must_not_contain: Keywords that must not be in the offer
            max_offers: Maximum number of offers to return
            
        Returns:
            ScrapeResult with mock offers
        """
        pass
    
    def get_search_url(
        self,
        must_contain: List[str],
        may_contain: List[str],
        must_not_contain: List[str],
        **kwargs
    ) -> str:
        """
        Build the search URL for this platform.
        Override in subclass if the platform supports direct URL access.
        """
        return ""

