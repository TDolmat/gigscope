# Mock data generators for scrapers

from .useme_mock import generate_useme_mock_offers
from .justjoinit_mock import generate_justjoinit_mock_offers
from .upwork_mock import generate_upwork_mock_offers
from .fiverr_mock import generate_fiverr_mock_offers
from .contra_mock import generate_contra_mock_offers
from .rocketjobs_mock import generate_rocketjobs_mock_offers

__all__ = [
    'generate_useme_mock_offers',
    'generate_justjoinit_mock_offers',
    'generate_upwork_mock_offers',
    'generate_fiverr_mock_offers',
    'generate_contra_mock_offers',
    'generate_rocketjobs_mock_offers',
]
