"""
Health check endpoint for monitoring and load balancers
"""

from flask import Blueprint, jsonify
from core.models import db
import time

bp = Blueprint('health', __name__, url_prefix='/api')


@bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint that verifies:
    - API is responding
    - Database connection is working
    
    Returns:
        JSON with status and optional error details
    """
    start_time = time.time()
    
    try:
        # Check database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = 'healthy'
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'
    
    response_time = time.time() - start_time
    
    # Overall health status
    is_healthy = db_status == 'healthy'
    
    response = {
        'status': 'healthy' if is_healthy else 'unhealthy',
        'database': db_status,
        'response_time': f'{response_time:.3f}s',
        'timestamp': int(time.time())
    }
    
    status_code = 200 if is_healthy else 503
    
    return jsonify(response), status_code

