import cloudscraper
from bs4 import BeautifulSoup
from urllib.parse import quote
from apify_client import ApifyClient

PLATFORM = "upwork"
SEARCH_URL_BASE = "https://www.upwork.com/nx/search/jobs/"


def get_search_url(must_contain, may_contain, must_not_contain, per_page=50, sort='recency', t=1):
    search_query = _build_search_query(must_contain, may_contain, must_not_contain)
    
    # Build full URL with query parameters
    url = f"{SEARCH_URL_BASE}?per_page={per_page}&sort={sort}&t={t}&q={search_query}"
    return url


def _build_search_query(must_contain, may_contain, must_not_contain):
    """Build the search query string with AND/OR/NOT logic."""
    final_query = ""

    if len(must_contain) > 0:
        if len(must_contain) > 1:
            final_query += "(" + " AND ".join(must_contain) + ")"
        else:
            final_query += must_contain[0]
        
    if len(may_contain) > 0:
        if len(final_query) > 0:
            final_query += " AND "

        if len(may_contain) > 1:
            final_query += "(" + " OR ".join(may_contain) + ")"
        else:
            final_query += may_contain[0]

    if len(must_not_contain) > 0:
        if len(final_query) > 0:
            final_query += " AND NOT "

        if len(must_not_contain) > 1:
            final_query += "(" + " OR ".join(must_not_contain) + ")"
        else:
            final_query += must_not_contain[0]

    return quote(final_query, safe='')


def apify_scrape_offers(url, api_key, print_logs=False):
    """
    Scrape offers from Upwork using Apify.
    
    Args:
        url: The search URL to scrape
        api_key: Apify API key
        print_logs: Whether to print logs during scraping
    
    Returns:
        Dict with 'offers' list and 'duration_millis'
    """
    if not api_key:
        return {
            "offers": [],
            "duration_millis": 0
        }
    
    client = ApifyClient(api_key)
    actor_id = "XYTgO05GT5qAoSlxy"

    run_input = {
        "paymentVerified": False,
        "rawUrl": url,
    }

    if print_logs:
        run = client.actor(actor_id).call(run_input=run_input)
    else:
        run = client.actor(actor_id).start(run_input=run_input)
        run = client.run(run["id"]).wait_for_finish()

    offers = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    print(run.items())
    
    return {
        "offers": offers, 
        "duration_millis": run["stats"]["durationMillis"] if run.get("stats", {}).get("durationMillis") else None
    }

def dummy_apify_scrape_offers(per_page=10):
    """
    Dummy scraper that returns sample offers for testing.
    Returns the requested number of offers (simulated).
    """
    sample_offer = {
        'id': '1992933491798151880', 
        'subId': '~021992933491798151880', 
        'title': 'Amazon FBA Specialist for PPC strategy', 
        'description': 'I\'m looking for an experienced Amazon Ads Specialist to help me set up and optimize advertising campaigns for my newly launched product on Amazon Germany (DE). My current setup only includes automatic campaigns, and I need a professional to take over the creation of manual campaigns, keyword research, and overall PPC strategy.\n\nIf this collaboration goes well, I will have more products launching soon and will need ongoing help with ads, keywords, and campaign optimization.', 
        'url': 'https://www.upwork.com/jobs/Amazon-FBA-Specialist-for-PPC-strategy_~021992933491798151880/?referrer_url_path=/nx/search/jobs/', 
        'budget': '$50.00', 
        'relativeDate': 'Posted 21 minutes ago', 
        'absoluteDate': '2025-11-24T12:29:06.297Z', 
        'jobType': 'Fixed', 
        'experienceLevel': 'Intermediate', 
        'paymentVerified': True, 
        'tags': ['Helium 10', 'Amazon PPC', 'PPC Campaign Setup & Management'], 
        'clientLocation': 'Denmark', 
        'clientHireRatePercent': 0, 
        'clientTotalSpent': 0, 
        'clientRating': 0, 
        'allowedApplicantCountries': None
    }
    
    # Generate requested number of offers (with slight variations)
    offers = []
    for i in range(per_page):
        offer = sample_offer.copy()
        offer['id'] = f'{1992933491798151880 + i}'
        offer['subId'] = f'~0{1992933491798151880 + i}'
        offer['title'] = f'{sample_offer["title"]} #{i+1}'
        offers.append(offer)
    
    return {
        "offers": offers,
        "duration_millis": 62700
    }