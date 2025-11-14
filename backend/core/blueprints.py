from api import admin, categories, scrape, auth

""" Add new blueprints here """
BLUEPRINTS = [
    admin.bp,
    categories.bp,
    scrape.bp,
    auth.bp,
]

