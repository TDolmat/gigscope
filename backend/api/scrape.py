from flask import Blueprint, request, jsonify
from core.config import CONFIG
from core.models import User, db, Offer
from http import HTTPStatus
from scrapers.useme import UsemeScraper
from scrapers.justjoinit import JustJoinItScraper
import time

bp = Blueprint('scrape', __name__, url_prefix='/scrape')

@bp.route('/useme', methods=['GET'])
def scrape_useme():
    offers = []

    um_scraper = UsemeScraper()
    categories = um_scraper.get_categories()
    max_pages = None

    # categories = categories[:1]
    # max_pages = 1

    for category in categories:
        time.sleep(3)
        category_offers = um_scraper.scrape_category_offers(category, max_pages)
        offers.extend(category_offers)
        
    offer_ids = Offer.query.with_entities(Offer.id).all()
    offer_ids = [offer_id[0] for offer_id in offer_ids]
    # TODO: Add checking if the offer is in scraped offers and in db then the offer is still active, if it is in db but not in scraped offers then the offer 
    #   is no longer active and should be removed or updated as not active

    added_offers_count = 0

    for offer in offers:
        if offer['id'] not in offer_ids:
            new_offer = Offer(
                id=offer['id'],
                title=offer['title'],
                description=offer['description'],
                category=offer['specific_category'], #TODO: change later
                specific_category=offer['specific_category'],
                budget=offer['budget'],
                url=offer['url'],
                platform=um_scraper.PLATFORM
            )
            db.session.add(new_offer)
            added_offers_count += 1
    db.session.commit()

    print(f"Added {added_offers_count} new offers")
    return jsonify(offers), HTTPStatus.OK

@bp.route('/justjoinit', methods=['GET'])
def scrape_justjoinit():
    offers = []

    jji_scraper = JustJoinItScraper()
    categories = jji_scraper.get_categories()

    # return jsonify(categories), HTTPStatus.OK

    for category in categories[:3]:
        # time.sleep(3)
        category_offers = jji_scraper.scrape_category_offers(category)
        offers.extend(category_offers)
    
    return jsonify(offers), HTTPStatus.OK

    # for category in categories:
    #     time.sleep(3)
    #     category_offers = jj_scraper.scrape_category_offers(category, max_pages)
    #     offers.extend(category_offers)