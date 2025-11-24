import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from urllib.parse import quote
import time


PLATFORM = "upwork"
SEARCH_URL = "https://www.upwork.com/nx/search/jobs/?per_page=50&sort=recency&t=1&q="


def get_search_url(must_contain, may_contain, must_not_contain):
    """Build search URL with query parameters."""
    search_query = _build_search_query(must_contain, may_contain, must_not_contain)
    return SEARCH_URL + search_query


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


def scrape_offers(must_contain=None, may_contain=None, must_not_contain=None):
    must_contain = must_contain or []
    may_contain = may_contain or []
    must_not_contain = must_not_contain or []
    
    url = get_search_url(must_contain, may_contain, must_not_contain)

    
    # undetected_chromedriver bypasses most bot detection
    options = uc.ChromeOptions()
    # DON'T use headless mode - Cloudflare detects it
    # options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    
    # Use Chromium with auto-detected version
    driver = uc.Chrome(
        options=options, 
        use_subprocess=True, 
        headless=False,
        version_main=144,  # Match Chromium version 144
        browser_executable_path="/Applications/Chromium.app/Contents/MacOS/Chromium"  # Use Chromium
    )
    
    try:
        print(f"Loading: {url}")
        driver.get(url)
        
        # Wait for Cloudflare challenge and page load
        print("Waiting for Cloudflare check to complete...")
        time.sleep(15)  # Give it more time to pass Cloudflare
        
        # Scroll to trigger lazy loading
        print("Scrolling page...")
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        time.sleep(3)
        
        # Check title
        print(f"Page title: {driver.title}")
        
        html_content = driver.page_source
        
        return parse_offers(html_content)
        
    finally:
        driver.quit()


def parse_offers(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Save prettified HTML to file
    with open('upwork_output.html', 'w', encoding='utf-8') as f:
        f.write(soup.prettify())
    
    print("HTML saved to upwork_output.html")
    
    # Try to find job listings
    offers = soup.select('article')
    print(f"Found {len(offers)} articles")
    
    # Check if we passed Cloudflare
    if "Just a moment" in soup.text or "Cloudflare" in soup.title.text if soup.title else "":
        print("⚠️  Still blocked by Cloudflare")
    else:
        print("✓ Successfully bypassed Cloudflare!")
    
    return []


if __name__ == "__main__":
    scrape_offers(
        must_contain=["n8n"],
        may_contain=["API", "Automation", "make.com"],
        must_not_contain=["WordPress", "PHP", "Backend"]
    )

