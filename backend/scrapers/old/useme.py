#!/usr/bin/env python3
"""
Useme.com freelance job scraper
Scrapes all categories and pages from https://useme.com/pl/jobs/
"""

import requests
from bs4 import BeautifulSoup  
from typing import List, Dict, Optional
import time
import re
from urllib.parse import urljoin, urlparse, parse_qs
from scrapers.base import OfferScraperBase, OfferScraperConfig


class UsemeScraper(OfferScraperBase):
    ID_PREFIX = "UM_"
    PLATFORM = "useme"
    BASE_URL = "https://useme.com"
    OFFERS_URL = "https://useme.com/pl/jobs/"

    def __init__(self, config: OfferScraperConfig = None):
        super().__init__(
            base_url=self.BASE_URL,
            offers_url=self.OFFERS_URL,
            config=config)
        
    def get_categories(self) -> List[Dict[str, str]]:
        print("Fetching categories...")
        try:
            response = self.make_request(self.offers_url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            categories = []

            # Use CSS selector for more concise query
            category_elements = soup.select('div[data-module="search-categories"] li.marketplace-categories__category a.marketplace-categories__category-link')
            
            for category_element in category_elements:
                # Use select_one for nested element
                category_name_elem = category_element.select_one('span.marketplace-categories__category-name')
                
                if category_name_elem:
                    category_name = category_name_elem.get_text(strip=True)
                    category_url = urljoin(self.base_url, category_element.get('href', ''))

                    categories.append({
                        'name': category_name,
                        'url': category_url
                    })

            return categories if categories else [{'name': 'All offers', 'url': self.offers_url}]

        except Exception as e:
            print(f"Error fetching categories: {e}")
            return [{'name': 'All offers', 'url': self.offers_url}]
    
    def get_total_pages(self, category_url: str) -> int:
        try:
            response = self.make_request(category_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all pagination buttons and get the last one
            pagination_buttons = soup.select('a.pagination__button')
            if not pagination_buttons:
                return 1
            
            last_button = pagination_buttons[-1]
            href = last_button.get('href', '')
            
            # Extract page number from href
            if 'page=' in href:
                max_page = int(href.split('page=')[-1])
                return max_page
            
            return 1

        except (ValueError, IndexError, AttributeError) as e:
            print(f"Error getting total pages: {e}")
            return 1
    
    def scrape_category_offers(self, category: dict, max_pages: int = None) -> List[Dict[str, str]]:
        print(f"\nScraping category: {category['name']}")
        offers = []
        category_url = category['url']

        if max_pages is None:
            max_pages = self.get_total_pages(category_url)
        
        for page in range(1, max_pages + 1):
            if '?' in category_url:
                page_url = f"{category_url}&page={page}"
            else:
                page_url = f"{category_url}?page={page}"
            
            print(f"  Fetching page {page}...")
            response = self.make_request(page_url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            offer_elements = soup.select('article.job')
            if not offer_elements:
                print(f"  No offers found on page {page}")
                break
            

            for offer_element in offer_elements:
                # Skip closed offers
                if offer_element.select_one('a.job__title-link--closed'):
                    return offers
            
                # Offer title and URL
                offer_title_element = offer_element.select_one('a.job__title')
                if not offer_title_element:
                    continue
                
                offer_title = offer_title_element.get_text(strip=True)
                offer_url = urljoin(self.base_url, offer_title_element.get('href', ''))
                
                # Offer ID from URL
                url_parts = offer_url.rstrip('/').split('/')
                offer_id = url_parts[-1].split(',')[-1] if url_parts else ''
                
                if not offer_id:
                    continue

                # Offer description
                offer_description_element = offer_element.select_one('p')
                offer_description = offer_description_element.get_text(strip=True) if offer_description_element else ''

                # Offer category
                offer_category_element = offer_element.select_one('div.job__category a')
                offer_category = offer_category_element.get_text(strip=True) if offer_category_element else ''

                # Offer budget
                offer_budget_element = offer_element.select_one('div.job__budget span.job__budget-value')
                offer_budget = offer_budget_element.get_text(strip=True) if offer_budget_element else ''

                offer = {
                    'id': self.ID_PREFIX + offer_id,
                    'url': offer_url,
                    'title': offer_title,
                    'description': offer_description,
                    'specific_category': offer_category,
                    'budget': offer_budget
                }
                
                offers.append(offer)
            
        return offers
