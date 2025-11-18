from api import admin, categories, scrape, auth, users

""" Add new blueprints here """
BLUEPRINTS = [
    admin.bp,
    categories.bp,
    scrape.bp,
    auth.bp,
    users.bp,
]

