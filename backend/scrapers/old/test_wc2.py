from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
from time import sleep

BASE_URL = "https://www.workconnect.app"
BASE_OFFERS_URL = "https://www.workconnect.app/zlecenia"

def scrape_workconnect_selenium():
    offers = []

    # Ustawienia drivera
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # Bez okna przeglądarki
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    driver.get(BASE_OFFERS_URL)

    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    ul_element = soup.select_one("div.mt-6 div.relative ul")
    li_elements = ul_element.find_all("li", recursive=False)
    
    for li in li_elements:
        sleep(1)
        main_link = li.find('a', recursive=False)

        if main_link:
            category_name = main_link.get_text(strip=True)
            category_url = BASE_URL + main_link.get('href', '')

            driver.get(category_url)
            print("Scraping category: " + category_name + " from " + category_url)
            category_soup = BeautifulSoup(driver.page_source, 'html.parser')


            # Szukamy wszystkich <li> z ofertami
            li_offers = category_soup.find_all(
                "li",
                class_=lambda x: x and "break-words" in x and "border-t" in x
            )
            
            seen_urls = set()  # Do deduplikacji
            
            for li in li_offers:
                # Znajdź link <a> wewnątrz <li>
                link = li.find("a", class_=lambda x: x and "rounded-2xl" in x)
                
                if not link:
                    continue
                    
                # Sprawdź czy oferta jest aktywna (NIE ma szarego tła)
                link_classes = ' '.join(link.get('class', []))
                if 'lg:bg-[#FAFAFA]' in link_classes:
                    continue  # Pomijamy nieaktywne oferty
                
                # Wyciągamy dane z oferty
                href = link.get('href', '')
                offer_url = BASE_URL + href if href else ''
                
                # Pomijamy duplikaty (sprawdzamy po URL)
                if offer_url in seen_urls:
                    continue
                seen_urls.add(offer_url)
                
                # Title - w <h5>
                title_elem = link.select_one("h5")
                title = title_elem.get_text(strip=True) if title_elem else ''
                
                # Client name - w pierwszym <div class="t-14-medium">
                client_elem = link.select_one("div.t-14-medium")
                client_name = client_elem.get_text(strip=True) if client_elem else ''
                
                # Budget - w <div class="t-14-medium leading-4"> (przy ikonie coin)
                budget_elem = link.select_one("div.t-14-medium.leading-4")
                budget = budget_elem.get_text(strip=True) if budget_elem else ''

                print(f"Scraping offer: {title} from {offer_url}")
                driver.get(offer_url)
                sleep(0.5)

                offer_details_soup = BeautifulSoup(driver.page_source, 'html.parser')
                
                # Description - w <div> z klasami t-16-default, max-w-[44.063rem], text-gray-primary
                description_elem = offer_details_soup.find(
                    "div",
                    class_=lambda x: x and "t-16-default" in x and "max-w-[44.063rem]" in x and "text-gray-primary" in x
                )
                description = description_elem.get_text(strip=True) if description_elem else ''
                
                offer = {
                    'title': title,
                    'url': offer_url,
                    'client_name': client_name,
                    'budget': budget,
                    'description': description
                }
                
                offers.append(offer)
                # print(f"  - {title}")
                # print(f"    Description: {description[:100]}..." if len(description) > 100 else f"    Description: {description}")
                # print(f"    Client name: {client_name}")
                # print(f"    Budget: {budget}")
                # print(f"    URL: {offer_url}")
                # print()
        
    return offers


if __name__ == "__main__":
    offers = scrape_workconnect_selenium()
    print(f"Znaleziono {len(offers)} ofert")