from api import admin, scrape, auth, users

""" Add new blueprints here """
BLUEPRINTS = [
    admin.bp,
    scrape.bp,
    auth.bp,
    users.bp,
]

