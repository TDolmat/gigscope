# https://justjoin.it/job-offers/remote?working-hours=freelance&orderBy=DESC&sortBy=newest
# Spory problem: elementy się łądują on scroll, więc trzeba scrollować stronę i ładować elementy dynamicznie
# Rozwiązanie?: użyć selenium do scrollowania strony i ładowania elementów dynamicznie
# Problem 2: nawet po przescrollowaniu nie pokazują się wszystkie oferty tylko 75
# To samo przy rocket jobs tylko tam 52 oferty max po scrollu

import requests
import re
from bs4 import BeautifulSoup
from scrapers.base import OfferScraperBase, OfferScraperConfig

class JustJoinItScraper(OfferScraperBase):
    ID_PREFIX = "JJI_"
    PLATFORM = "justjoinit"
    BASE_URL = "https://justjoin.it"
    OFFERS_URL = "https://justjoin.it/job-offers/remote?working-hours=freelance&orderBy=DESC&sortBy=newest"
    
    def __init__(self, config: OfferScraperConfig = None):
        super().__init__(
            base_url=self.BASE_URL,
            offers_url=self.OFFERS_URL,
            config=config)

    def get_categories(self):
        print("Fetching categories...")
        try:
            response = self.make_request(self.offers_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            categories = []

            category_elements = soup.select('a.offer_list_category_link')

            for category_element in category_elements:
                categeory_name_element = category_element.select('span')

                # Category name
                if len(categeory_name_element) > 0:
                    categeory_name = categeory_name_element[1].get_text().strip()
                else:
                    categeory_name = ''

                # Category URL
                category_url = self.BASE_URL + category_element.get('href', '')

                categories.append({
                    'name': categeory_name,
                    'url': category_url
                })

            return categories if categories else [{'name': 'All offers', 'url': self.offers_url}]

        except Exception as e:
            print(f"Error fetching categories: {e}")
            return [{'name': 'All offers', 'url': self.offers_url}]

    def get_total_pages(self, category_url: str):
        return 1 # Only one page per category

    def scrape_category_offers(self, category: dict, max_pages: int = 1):
        print(f"Scraping category: {category['name']}")
        offers = []
        category_url = category['url']

        # Not implementing multiple pages

        response = self.make_request(category_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        offer_elements = soup.select('li.MuiBox-root')

        for offer_element in offer_elements:
            # Offer title
            offer_title_element = offer_element.select_one('h3')
            offer_title = offer_title_element.get_text().strip() if offer_title_element else ''

            # Offer URL
            offer_url_element = offer_element.select_one('a.offer-card')
            offer_url = self.BASE_URL + offer_url_element.get('href', '') if offer_url_element else ''

            # Offer budget
            offer_budget_element = offer_element.select_one('h6')
            offer_budget = offer_budget_element.get_text().strip() if offer_budget_element else ''

            # Company name
            offer_company_name_element = offer_element.select_one('p.MuiTypography-root.MuiTypography-body1')
            offer_company_name = offer_company_name_element.get_text().strip() if offer_company_name_element else ''

            offer = {
                'id': self.ID_PREFIX + offer_url.split('/')[-1],
                'url': offer_url,
                'title': offer_title,
                'description': '',
                'category': '',
                'specific_category': '',
                'budget': offer_budget,
                'client_name': offer_company_name
            }

            offers.append(offer)
        return offers


