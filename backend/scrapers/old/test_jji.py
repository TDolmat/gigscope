import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import quote
from typing import List, Dict, Any


PLATFORM = "justjoinit"
BASE_URL = "https://justjoin.it"
SEARCH_URL_BASE = "https://justjoin.it/job-offers/remote?working-hours=freelance&orderBy=DESC&sortBy=published"
MAX_OFFERS = 10 #should be defined in the app settings

def main():
    offers = []

    must_inlcude = ["python, java"]

    def get_search_url(must_inlcude: List[str]) -> str:
        query = ", ".join(must_inlcude)
        encoded_query = quote(query).replace("%2C", ",").replace("%20", "+")
        return f"{SEARCH_URL_BASE}&keyword={encoded_query}"

    url = get_search_url(must_inlcude)

    print(f"Scraping JustJoinIt offers for url: {url}")

    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    offer_elements = soup.select('li.MuiBox-root')

    for offer_element in offer_elements:
        if len(offers) >= MAX_OFFERS:
            break

        # Offer title
        offer_title_element = offer_element.select_one('h3')
        offer_title = offer_title_element.get_text().strip() if offer_title_element else ''

        # Offer URL
        offer_url_element = offer_element.select_one('a.offer-card')
        offer_url = BASE_URL + offer_url_element.get('href', '') if offer_url_element else ''

        # Offer budget
        offer_budget_element = offer_element.select_one('h6')
        offer_budget = offer_budget_element.get_text().strip() if offer_budget_element else ''

        # Company name
        offer_company_name_element = offer_element.select_one('p.MuiTypography-root.MuiTypography-body1')
        offer_company_name = offer_company_name_element.get_text().strip() if offer_company_name_element else ''

        # print(f"Scraping offer: {offer_title} from {offer_url}")

        # time.sleep(1)
        # offer_details_response = requests.get(offer_url)
        # offer_details_soup = BeautifulSoup(offer_details_response.content, 'html.parser')

        # offer_description_element = offer_details_soup.select_one('div.MuiBox-root.mui-1iv35pp')
        # offer_description = offer_description_element.get_text().strip() if offer_description_element else ''

        offer = {
            'url': offer_url,
            'title': offer_title,
            # 'description': offer_description,
            'budget': offer_budget,
            'client_name': offer_company_name
        }

        offers.append(offer)
    return offers


if __name__ == "__main__":
    offers = main()
    print(len(offers))

    for offer in offers:
        print(offer['title'])
        print(offer['url'])
        print("---")