"""add_is_primary_to_clinical_notes

Revision ID: 38e3d565e383
Revises: 659fbcd3b1dc
Create Date: 2026-02-05 17:06:50.079525

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '38e3d565e383'
down_revision: Union[str, None] = '659fbcd3b1dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_primary column
    op.add_column(
        'clinical_notes',
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Add index for faster primary note lookups
    op.create_index(
        'idx_clinical_notes_visit_primary',
        'clinical_notes',
        ['visit_id', 'is_primary'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('idx_clinical_notes_visit_primary', table_name='clinical_notes')
    op.drop_column('clinical_notes', 'is_primary')
