"""Drop user_subscriptions table - subscription now managed via external BeFreeClub API

Revision ID: a1b2c3d4e5f7
Revises: c81c000ff360
Create Date: 2025-12-11

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f7'
down_revision = 'c81c000ff360'
branch_labels = None
depends_on = None


def upgrade():
    """Drop the user_subscriptions table - no longer needed.
    
    Subscription status is now determined by querying the BeFreeClub API
    at https://api.befreeclub.pro/subscribers
    """
    # Drop the table and all its data
    op.drop_table('user_subscriptions')


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

