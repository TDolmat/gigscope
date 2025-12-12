"""Drop user_subscriptions table - subscription now managed via external BeFreeClub API

Revision ID: d1e2f3a4b5c6
Revises: c81c000ff360
Create Date: 2025-12-11

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd1e2f3a4b5c6'
down_revision = 'c81c000ff360'
branch_labels = None
depends_on = None


def upgrade():
    """Drop the user_subscriptions table if it exists - no longer needed.
    
    Subscription status is now determined by querying the BeFreeClub API
    at https://api.befreeclub.pro/subscribers
    """
    # Use IF EXISTS to make migration idempotent (safe to run multiple times)
    op.execute('DROP TABLE IF EXISTS user_subscriptions')


def downgrade():
    """Recreate the user_subscriptions table if needed."""
    op.create_table('user_subscriptions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('subscribed_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
