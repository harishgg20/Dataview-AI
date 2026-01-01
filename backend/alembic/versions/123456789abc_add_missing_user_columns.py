"""add missing user columns

Revision ID: 123456789abc
Revises: 61e63e74a343
Create Date: 2026-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '123456789abc'
down_revision = '61e63e74a343'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('avatar_data', sa.String(), nullable=True))
    op.add_column('users', sa.Column('phone_number', sa.String(), nullable=True))
    op.add_column('users', sa.Column('job_title', sa.String(), nullable=True))
    op.add_column('users', sa.Column('api_key', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'avatar_data')
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'job_title')
    op.drop_column('users', 'api_key')
