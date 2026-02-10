"""Create ICD-10 codes table

Revision ID: 20260204_0955
Revises: 20260203_2200
Create Date: 2026-02-04 09:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260204_0955'
down_revision = 'b1c2d3e4f5a6'  # vitals table
branch_labels = None
depends_on = None


def upgrade():
    # Enable pg_trgm extension for fast text search
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    
    # ICD-10 reference table
    op.create_table(
        'icd10_codes',
        sa.Column('code', sa.String(10), primary_key=True),  # e.g., "E11.9"
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('subcategory', sa.String(100), nullable=True),
        sa.Column('search_text', sa.Text, nullable=True),  # Lowercase for search
        sa.Column('usage_count', sa.Integer, default=0),  # Track popularity
        sa.Column('common_in_india', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Indexes for fast search (GIN with trigram operator)
    op.execute("""
        CREATE INDEX idx_icd10_search ON icd10_codes 
        USING gin(search_text gin_trgm_ops)
    """)
    op.create_index('idx_icd10_category', 'icd10_codes', ['category'])
    op.create_index('idx_icd10_usage', 'icd10_codes', ['usage_count'])
    op.create_index('idx_icd10_common', 'icd10_codes', ['common_in_india'])


def downgrade():
    op.drop_table('icd10_codes')
    # Extension can stay as other tables might use it
