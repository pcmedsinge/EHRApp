"""change_diagnosis_enums_to_string

Revision ID: 1df9690466cf
Revises: 50344d8218cd
Create Date: 2026-02-04 15:27:48.207969

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1df9690466cf'
down_revision: Union[str, None] = '50344d8218cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change columns from enum to varchar using USING clause to convert values
    op.execute("ALTER TABLE diagnoses ALTER COLUMN diagnosis_type TYPE VARCHAR(20) USING diagnosis_type::text")
    op.execute("ALTER TABLE diagnoses ALTER COLUMN status TYPE VARCHAR(20) USING status::text")
    op.execute("ALTER TABLE diagnoses ALTER COLUMN severity TYPE VARCHAR(20) USING severity::text")


def downgrade() -> None:
    # Convert back to enum types
    op.execute("ALTER TABLE diagnoses ALTER COLUMN diagnosis_type TYPE diagnosis_type_enum USING diagnosis_type::diagnosis_type_enum")
    op.execute("ALTER TABLE diagnoses ALTER COLUMN status TYPE diagnosis_status_enum USING status::diagnosis_status_enum")
    op.execute("ALTER TABLE diagnoses ALTER COLUMN severity TYPE severity_enum USING severity::severity_enum")
