"""create_clinical_notes_table

Revision ID: 659fbcd3b1dc
Revises: 1df9690466cf
Create Date: 2026-02-05 17:00:20.341244

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision: str = '659fbcd3b1dc'
down_revision: Union[str, None] = '1df9690466cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Clinical notes table
    op.create_table(
        'clinical_notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('visit_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('visits.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        
        # Note type (soap, progress, discharge, consultation, procedure)
        sa.Column('note_type', sa.String(20), nullable=False, server_default='soap'),
        
        # SOAP Format
        sa.Column('subjective', sa.Text, nullable=True),  # Chief complaint, HPI, symptoms
        sa.Column('objective', sa.Text, nullable=True),   # Physical exam, vitals, findings
        sa.Column('assessment', sa.Text, nullable=True),  # Diagnosis, impression
        sa.Column('plan', sa.Text, nullable=True),        # Treatment plan, orders
        
        # Additional fields
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        
        # Locking/Signing
        sa.Column('is_locked', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('locked_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default='false')
    )
    
    # Indexes for performance
    op.create_index('idx_clinical_notes_visit_id', 'clinical_notes', ['visit_id'])
    op.create_index('idx_clinical_notes_patient_id', 'clinical_notes', ['patient_id'])
    op.create_index('idx_clinical_notes_created_by', 'clinical_notes', ['created_by'])
    op.create_index('idx_clinical_notes_created_at', 'clinical_notes', ['created_at'])
    op.create_index('idx_clinical_notes_is_deleted', 'clinical_notes', ['is_deleted'])
    
    # Note templates table
    op.create_table(
        'note_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('note_type', sa.String(20), nullable=False),
        sa.Column('specialty', sa.String(100), nullable=True),
        
        # Template content
        sa.Column('subjective_template', sa.Text, nullable=True),
        sa.Column('objective_template', sa.Text, nullable=True),
        sa.Column('assessment_template', sa.Text, nullable=True),
        sa.Column('plan_template', sa.Text, nullable=True),
        
        # Metadata
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        
        # Audit
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    op.create_index('idx_note_templates_note_type', 'note_templates', ['note_type'])
    op.create_index('idx_note_templates_is_active', 'note_templates', ['is_active'])


def downgrade() -> None:
    op.drop_index('idx_note_templates_is_active')
    op.drop_index('idx_note_templates_note_type')
    op.drop_table('note_templates')
    
    op.drop_index('idx_clinical_notes_is_deleted')
    op.drop_index('idx_clinical_notes_created_at')
    op.drop_index('idx_clinical_notes_created_by')
    op.drop_index('idx_clinical_notes_patient_id')
    op.drop_index('idx_clinical_notes_visit_id')
    op.drop_table('clinical_notes')
