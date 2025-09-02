"""add role to campaign_members

Revision ID: 0002_add_role_to_campaign_members
Revises: 0001_initial
Create Date: 2025-09-02 00:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0002_add_role_to_campaign_members'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # Add role column with default 'player'
    op.add_column('campaign_members', sa.Column('role', sa.Text(), nullable=True))
    # Backfill existing rows to 'player'
    op.execute("UPDATE campaign_members SET role = 'player' WHERE role IS NULL")
    # If desired, owners can be promoted to 'dm' manually later; no automatic owner promotion here.


def downgrade():
    op.drop_column('campaign_members', 'role')
