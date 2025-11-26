from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.scrape import scrape_offers_for_user, scrape_offers_for_all_users
from helpers.user_helper import is_user_subscribed

bp = Blueprint('scrape', __name__, url_prefix='/api/scrape')


@bp.route('/trigger', methods=['POST'])
@jwt_required()
def trigger_scrape():
    current_user_id = get_jwt_identity()
    result = scrape_offers_for_user(current_user_id, print_logs=False)
    status_code = 200 if result['success'] else 400
    return jsonify(result), status_code


@bp.route('/trigger-all', methods=['POST'])
@jwt_required()
def trigger_scrape_all():
    result = scrape_offers_for_all_users(print_logs=False)
    return jsonify(result), 200


@bp.route('/subscription-status/<int:user_id>', methods=['GET'])
@jwt_required()
def check_subscription_status(user_id):
    is_active = is_user_subscribed(user_id)
    return jsonify({
        'user_id': user_id,
        'has_active_subscription': is_active
    }), 200
