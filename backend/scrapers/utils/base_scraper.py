"""
Base scraper interface that all platform scrapers must implement.
Each platform scraper should provide both real and mock implementations.
"""
import time
import requests
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from dataclasses import dataclass


HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}


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


def make_request(
    url: str, 
    headers: dict = HEADERS,
    sleep_interval_seconds: float = 1.0, 
    max_retries: int = 3,
    backoff_factor: float = 2.0
) -> requests.Response:
    """
    Make HTTP GET request with retry logic and exponential backoff.
    
    Args:
        url: URL to request
        headers: Optional headers dict
        sleep_interval_seconds: Initial sleep before first request
        max_retries: Number of retry attempts
        backoff_factor: Multiplier for wait time after each failure
        
    Returns:
        Response object or None if all retries failed
        
    Handles:
        - Rate limiting (HTTP 429) with exponential backoff
        - Connection errors with retries
        - Server errors (5xx) with retries
    """
    wait_time = sleep_interval_seconds
    last_error = None
    
    for attempt in range(max_retries):
        try:
            time.sleep(wait_time)
            response = requests.get(url, headers=headers, timeout=30)
            
            # Handle rate limiting specifically
            if response.status_code == 429:
                retry_after = response.headers.get('Retry-After')
                if retry_after:
                    wait_time = float(retry_after)
                else:
                    wait_time *= backoff_factor
                print(f"Rate limited (429) on {url}, waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                continue
            
            # Retry on server errors
            if response.status_code >= 500:
                wait_time *= backoff_factor
                print(f"Server error ({response.status_code}) on {url}, retry {attempt + 1}/{max_retries}")
                continue
                
            response.raise_for_status()
            return response
            
        except requests.exceptions.Timeout as e:
            last_error = e
            wait_time *= backoff_factor
            print(f"Timeout on {url}, retry {attempt + 1}/{max_retries}")
            
        except requests.exceptions.ConnectionError as e:
            last_error = e
            wait_time *= backoff_factor
            print(f"Connection error on {url}: {e}, retry {attempt + 1}/{max_retries}")
            
        except requests.exceptions.RequestException as e:
            last_error = e
            print(f"Request error on {url}: {e}")
            break  # Don't retry on other errors (e.g., 4xx client errors)
    
    print(f"All {max_retries} retries failed for {url}. Last error: {last_error}")
    return None