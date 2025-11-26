from api import admin, scrape, auth, users, health

""" Add new blueprints here """
BLUEPRINTS = [
    health.bp,  # Health check first (no auth required)
    admin.bp,
    scrape.bp,
    auth.bp,
    users.bp,
]

