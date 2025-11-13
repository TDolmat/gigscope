from abc import ABC, abstractmethod
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import time


class OfferScraperConfig:
    """Configuration for scraper behavior"""
    
    def __init__(
        self,
        max_retries: int = 3, # number of retries for the request
        timeout: int = 30, # timeout for the request
        backoff_factor: float = 2.0, # factor by which the wait time increases after each retry
        user_agent: str = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        max_concurrent_requests: int = 5 # number of concurrent requests to the same host (for TCP connection pooling not for asynchronous requests)
    ):
        self.max_retries = max_retries
        self.timeout = timeout
        self.backoff_factor = backoff_factor
        self.user_agent = user_agent
        self.max_concurrent_requests = max_concurrent_requests

class OfferScraperBase(ABC):
    """
    Abstract base class for all platform scrapers.
    Provides common functionality and enforces implementation of required methods.
    """

    def __init__(self, base_url: str, offers_url: str, config: OfferScraperConfig = None):
        self.config = config if config else OfferScraperConfig()
        self.base_url = base_url
        self.offers_url = offers_url
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """
        Create a requests session with retry logic and proper configuration
        """
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=self.config.max_retries,
            backoff_factor=self.config.backoff_factor,
            status_forcelist=[408, 429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=self.config.max_concurrent_requests,
            pool_maxsize=self.config.max_concurrent_requests
        )
        
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set default headers
        session.headers.update({
            'User-Agent': self.config.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        return session
    

    def make_request(
        self,
        url: str,
        method: str = 'GET',
        **kwargs
    ) -> requests.Response:
        """
        Make an HTTP request with retry logic, rate limiting, and error handling.
        """
        # Set timeout if not provided
        if 'timeout' not in kwargs:
            kwargs['timeout'] = self.config.timeout
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            
            return response
        
        except requests.exceptions.HTTPError as e:
            # Tu trafiamy dopiero po wyczerpaniu wszystkich retry
            print(f"✗ HTTP error {e.response.status_code} for {url} after retries: {e}")
            raise Exception(f"HTTP error for {url}: {e}") from e
            
        except requests.exceptions.Timeout as e:
            print(f"✗ Timeout for {url} after retries: {e}")
            raise Exception(f"Timeout for {url}: {e}") from e
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Request failed for {url}: {e}")
            raise Exception(f"Request failed for {url}: {e}") from e

    @abstractmethod
    def get_categories(self):
        pass

    @abstractmethod
    def get_total_pages(self, category_url: str):
        pass

    @abstractmethod
    def scrape_category_offers(self, category: dict, max_pages: int = None):
        pass
