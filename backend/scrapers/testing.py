import requests
import re
from bs4 import BeautifulSoup

BASE_URL = "https://justjoin.it"


def main():
    url = "https://justjoin.it/job-offers/remote/javascript?working-hours=freelance&orderBy=DESC&sortBy=published"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    offers = soup.select('li.MuiBox-root')

    # offers = offers[:1]
    
    for offer in offers:
        title = offer.select_one('h3').get_text().strip()
        url = BASE_URL + offer.select_one('a.offer-card')['href']
        budget = offer.select_one('h6').get_text().strip()
        company_name = offer.select_one('p.MuiTypography-root.MuiTypography-body1').get_text().strip()


        # print(f"Title: {title}")
        # print(f"URL: {url}")
        # print(f"Budget: {budget}")
        print(f"Company Name: {company_name}")
        # print("---")
    print(len(offers))

def main2():
    url = "https://justjoin.it/job-offers/remote?working-hours=freelance&orderBy=DESC&sortBy=newest"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    category_elements = soup.select('a.offer_list_category_link')

    for category_element in category_elements:
        categeory_name_element = category_element.select('span')
        if len(categeory_name_element) > 0:
            categeory_name = categeory_name_element[1].get_text().strip()
        else:
            categeory_name = ''

        category_url = BASE_URL + category_element.get('href', '')

        print(f"Name: {categeory_name}")
        print(f"URL: {category_url}")
        print("---")
        

if __name__ == "__main__":
    main()
    # main2()
