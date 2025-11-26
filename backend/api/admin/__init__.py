from flask import Blueprint

# Main admin blueprint
bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Import sub-modules to register their routes
from . import users, settings, dashboard, mail, manual_runs, logs

