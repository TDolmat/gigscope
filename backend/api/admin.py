from flask import Blueprint, request, jsonify
from core.config import CONFIG
from core.models import User, db, Config
from http import HTTPStatus

bp = Blueprint('admin', __name__, url_prefix='/admin')


@bp.route('/config', methods=['GET'])
def get_config():
    # Get all configs and return as a dictionary
    configs = Config.query.all()
    config_dict = {config.key: config.value for config in configs}
    return jsonify(config_dict), HTTPStatus.OK


@bp.route('/config', methods=('POST',))
def post_config():
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'Request body must contain key-value pairs'
        }), HTTPStatus.BAD_REQUEST
    
    # Fetch all existing configs once
    existing_configs = {config.key: config for config in Config.query.all()}
    
    updated_configs = []
    
    for key, value in data.items():
        if key in existing_configs:
            # Update existing config
            existing_configs[key].value = str(value)
            updated_configs.append({'key': key, 'value': str(value), 'action': 'updated'})
        else:
            # Create new config
            new_config = Config(key=key, value=str(value))
            db.session.add(new_config)
            updated_configs.append({'key': key, 'value': str(value), 'action': 'created'})
    
    db.session.commit()
    
    return jsonify({
        'message': f'Successfully processed {len(updated_configs)} config(s)',
        'configs': updated_configs
    }), HTTPStatus.OK