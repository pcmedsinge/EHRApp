"""rename_clinical_notes_to_notes

Revision ID: 50344d8218cd
Revises: 20260204_0956
Create Date: 2026-02-04 14:48:55.267075

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50344d8218cd'
down_revision: Union[str, None] = '20260204_0956'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename column from clinical_notes to notes
    op.alter_column('diagnoses', 'clinical_notes', new_column_name='notes')


def downgrade() -> None:
    # Rename column back from notes to clinical_notes
    op.alter_column('diagnoses', 'notes', new_column_name='clinical_notes')
