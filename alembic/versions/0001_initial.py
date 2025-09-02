"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2025-09-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'campaigns',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('avatar', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
    )
    op.create_table(
        'campaign_members',
        sa.Column('campaign_id', sa.Text(), nullable=False),
        sa.Column('user_id', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('campaign_id', 'user_id', name='pk_campaign_members')
    )
    op.create_index('ix_campaign_members_user_id', 'campaign_members', ['user_id'])
    op.create_table(
        'user_settings',
        sa.Column('user_id', sa.Text(), primary_key=True),
        sa.Column('active_campaign_id', sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_table('user_settings')
    op.drop_index('ix_campaign_members_user_id', table_name='campaign_members')
    op.drop_table('campaign_members')
    op.drop_table('campaigns')
