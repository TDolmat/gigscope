"""
Base class for keyword-based scrapers.

Search Strategy:
- must_include: Single request (platform handles AND logic), no client-side filtering
- may_include: Multiple requests (one per keyword), client-side filtering for must_include
- must_not_include: Always filtered client-side

Each platform extends this and implements:
- build_search_url(query) - how to construct the search URL
- parse_offers_from_html(html) - how to extract offers from HTML
"""

import time
import requests
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class KeywordScraper(ABC):
    """Base class for keyword-based scrapers."""
    
    HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
    
    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Platform identifier (e.g., 'useme', 'justjoin')"""
        pass
    
    @abstractmethod
    def build_search_url(self, query: str) -> str:
        """Build the search URL for the given query string."""
        pass
    
    @abstractmethod
    def parse_offers_from_html(self, html: str) -> List[Dict[str, Any]]:
        """
        Parse offers from HTML content.
        
        Returns list of dicts with keys:
        - title (required)
        - description (required) 
        - url (required)
        - budget (optional)
        - client_name (optional)
        - client_location (optional)
        """
        pass
    
    def join_keywords_for_search(self, keywords: List[str]) -> str:
        """
        Join keywords for a single search query.
        Override if platform uses different separator (default: comma for AND).
        """
        return ", ".join(keywords)
    
    # -------------------------------------------------------------------------
    # Shared logic - do not override unless necessary
    # -------------------------------------------------------------------------
    
    def scrape_raw(self, query: str) -> List[Dict[str, Any]]:
        """Scrape offers for a query without any filtering."""
        url = self.build_search_url(query)
        print(f"Scraping URL: {url}")
        
        # Rate limiting: 1 request per second
        time.sleep(1)
        
        response = requests.get(url, headers=self.HEADERS)
        offers = self.parse_offers_from_html(response.content)
        
        # Add platform to each offer
        for offer in offers:
            offer['platform'] = self.platform_name
        
        return offers
    
    def scrape(
        self,
        must_include_keywords: str = "",
        may_include_keywords: str = "",
        must_not_include_keywords: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Main scrape method with keyword filtering.
        
        Args:
            must_include_keywords: Comma-separated keywords (ALL must be present)
            may_include_keywords: Comma-separated keywords (searches for each, filters for must_include)
            must_not_include_keywords: Comma-separated keywords (NONE should be present)
        """
        must_include = self._parse_keywords(must_include_keywords)
        may_include = self._parse_keywords(may_include_keywords)
        must_not_include = self._parse_keywords(must_not_include_keywords)
        
        all_offers = []
        
        # Path 1: must_include - single request, platform handles AND, no client filtering
        if must_include:
            query = self.join_keywords_for_search(must_include)
            offers = self.scrape_raw(query)
            # Only filter out must_not_include
            offers = self._filter_offers(offers, must_not_include=must_not_include)
            all_offers.extend(offers)
        
        # Path 2: may_include - multiple requests, client-side filtering for must_include
        for keyword in may_include:
            offers = self.scrape_raw(keyword)
            # Filter for must_include AND must_not_include
            offers = self._filter_offers(offers, must_include=must_include, must_not_include=must_not_include)
            all_offers.extend(offers)
        
        return self._deduplicate(all_offers)
    
    # -------------------------------------------------------------------------
    # Private helpers
    # -------------------------------------------------------------------------
    
    def _parse_keywords(self, keywords_string: str) -> List[str]:
        """Parse comma-separated keywords string into a list."""
        if not keywords_string:
            return []
        return [k.strip() for k in keywords_string.split(",") if k.strip()]
    
    def _filter_offers(
        self,
        offers: List[Dict[str, Any]],
        must_include: Optional[List[str]] = None,
        must_not_include: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Filter offers based on keyword criteria."""
        must_include = must_include or []
        must_not_include = must_not_include or []
        
        filtered = []
        for offer in offers:
            text = f"{offer.get('title', '')} {offer.get('description', '') or ''}".lower()
            
            # Check must_include (ALL required)
            if must_include:
                if not all(kw.lower() in text for kw in must_include):
                    continue
            
            # Check must_not_include (NONE allowed)
            if must_not_include:
                if any(kw.lower() in text for kw in must_not_include):
                    continue
            
            filtered.append(offer)
        
        return filtered
    
    def _deduplicate(self, offers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate offers by URL."""
        unique = {offer['url']: offer for offer in offers}
        return list(unique.values())

