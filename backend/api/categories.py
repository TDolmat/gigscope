from flask import Blueprint, request, jsonify
from core.config import CONFIG
from core.models import User, db, Config
from http import HTTPStatus

bp = Blueprint('api', __name__, url_prefix='/api')


@bp.route('/categories', methods=['GET'])
def get_categories():
    categories_config = Config.query.filter_by(key=Config.ConfigKey.CATEGORIES.value).first()
    if categories_config and categories_config.value:
        return jsonify(categories_config.value), HTTPStatus.OK
    return jsonify([]), HTTPStatus.OK

