"""Add scoring fields to offers and OpenAI settings

Revision ID: a1b2c3d4e5f7
Revises: c81c000ff360
Create Date: 2025-12-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f7'
down_revision = 'c81c000ff360'
branch_labels = None
depends_on = None


def upgrade():
    # Add scoring fields to offers table
    op.add_column('offers', sa.Column('fit_score', sa.Float(), nullable=True))
    op.add_column('offers', sa.Column('attractiveness_score', sa.Float(), nullable=True))
    op.add_column('offers', sa.Column('overall_score', sa.Float(), nullable=True))
    
    # Add OpenAI and test keyword settings to app_settings
    op.add_column('app_settings', sa.Column('openai_api_key', sa.String(), nullable=True))
    op.add_column('app_settings', sa.Column('openai_scoring_prompt', sa.Text(), nullable=True))
    op.add_column('app_settings', sa.Column('test_must_contain', sa.JSON(), nullable=True))
    op.add_column('app_settings', sa.Column('test_may_contain', sa.JSON(), nullable=True))
    op.add_column('app_settings', sa.Column('test_must_not_contain', sa.JSON(), nullable=True))


def downgrade():
    # Remove scoring fields from offers
    op.drop_column('offers', 'fit_score')
    op.drop_column('offers', 'attractiveness_score')
    op.drop_column('offers', 'overall_score')
    
    # Remove OpenAI and test keyword settings from app_settings
    op.drop_column('app_settings', 'openai_api_key')
    op.drop_column('app_settings', 'openai_scoring_prompt')
    op.drop_column('app_settings', 'test_must_contain')
    op.drop_column('app_settings', 'test_may_contain')
    op.drop_column('app_settings', 'test_must_not_contain')

