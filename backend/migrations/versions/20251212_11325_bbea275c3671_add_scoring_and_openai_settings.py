"""Add scoring and OpenAI settings

Revision ID: bbea275c3671
Revises: d1e2f3a4b5c6
Create Date: 2025-12-12 11:03:25.409596

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'bbea275c3671'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add columns to app_settings (only if they don't exist)
    if not column_exists('app_settings', 'openai_api_key'):
        op.add_column('app_settings', sa.Column('openai_api_key', sa.String(), nullable=True))
    if not column_exists('app_settings', 'openai_scoring_prompt'):
        op.add_column('app_settings', sa.Column('openai_scoring_prompt', sa.Text(), nullable=True))
    if not column_exists('app_settings', 'test_must_contain'):
        op.add_column('app_settings', sa.Column('test_must_contain', sa.JSON(), nullable=True))
    if not column_exists('app_settings', 'test_may_contain'):
        op.add_column('app_settings', sa.Column('test_may_contain', sa.JSON(), nullable=True))
    if not column_exists('app_settings', 'test_must_not_contain'):
        op.add_column('app_settings', sa.Column('test_must_not_contain', sa.JSON(), nullable=True))

    # Add columns to offers (only if they don't exist)
    if not column_exists('offers', 'fit_score'):
        op.add_column('offers', sa.Column('fit_score', sa.Float(), nullable=True))
    if not column_exists('offers', 'attractiveness_score'):
        op.add_column('offers', sa.Column('attractiveness_score', sa.Float(), nullable=True))
    if not column_exists('offers', 'overall_score'):
        op.add_column('offers', sa.Column('overall_score', sa.Float(), nullable=True))


def downgrade():
    # Drop columns from offers
    if column_exists('offers', 'overall_score'):
        op.drop_column('offers', 'overall_score')
    if column_exists('offers', 'attractiveness_score'):
        op.drop_column('offers', 'attractiveness_score')
    if column_exists('offers', 'fit_score'):
        op.drop_column('offers', 'fit_score')

    # Drop columns from app_settings
    if column_exists('app_settings', 'test_must_not_contain'):
        op.drop_column('app_settings', 'test_must_not_contain')
    if column_exists('app_settings', 'test_may_contain'):
        op.drop_column('app_settings', 'test_may_contain')
    if column_exists('app_settings', 'test_must_contain'):
        op.drop_column('app_settings', 'test_must_contain')
    if column_exists('app_settings', 'openai_scoring_prompt'):
        op.drop_column('app_settings', 'openai_scoring_prompt')
    if column_exists('app_settings', 'openai_api_key'):
        op.drop_column('app_settings', 'openai_api_key')
