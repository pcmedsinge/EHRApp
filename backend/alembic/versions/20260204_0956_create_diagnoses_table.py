"""Create diagnoses table

Revision ID: 20260204_0956
Revises: 20260204_0955
Create Date: 2026-02-04 09:56:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '20260204_0956'
down_revision = '20260204_0955'
branch_labels = None
depends_on = None


def upgrade():
    # Diagnosis type enum
    diagnosis_type_enum = postgresql.ENUM(
        'primary', 'secondary',
        name='diagnosis_type_enum',
        create_type=False
    )
    diagnosis_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Diagnosis status enum
    diagnosis_status_enum = postgresql.ENUM(
        'provisional', 'confirmed',
        name='diagnosis_status_enum',
        create_type=False
    )
    diagnosis_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Severity enum
    severity_enum = postgresql.ENUM(
        'mild', 'moderate', 'severe', 'critical',
        name='severity_enum',
        create_type=False
    )
    severity_enum.create(op.get_bind(), checkfirst=True)
    
    # Diagnoses table
    op.create_table(
        'diagnoses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('visit_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('visits.id', ondelete='CASCADE'), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False),
        sa.Column('diagnosed_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id'), nullable=False),
        
        # ICD-10 code is OPTIONAL (nullable)
        sa.Column('icd10_code', sa.String(10), 
                  sa.ForeignKey('icd10_codes.code'), nullable=True),
        
        # Description is REQUIRED (either from ICD-10 or free text)
        sa.Column('diagnosis_description', sa.Text, nullable=False),
        
        # Diagnosis metadata
        sa.Column('diagnosis_type', diagnosis_type_enum, nullable=False),
        sa.Column('status', diagnosis_status_enum, nullable=False, server_default='provisional'),
        sa.Column('severity', severity_enum, nullable=True),
        sa.Column('diagnosed_date', sa.Date, nullable=False, server_default=sa.func.current_date()),
        sa.Column('onset_date', sa.Date, nullable=True),
        sa.Column('clinical_notes', sa.Text, nullable=True),
        
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_deleted', sa.Boolean, default=False, server_default=sa.false())
    )
    
    # Indexes
    op.create_index('idx_diagnoses_visit', 'diagnoses', ['visit_id'])
    op.create_index('idx_diagnoses_patient', 'diagnoses', ['patient_id'])
    op.create_index('idx_diagnoses_icd10', 'diagnoses', ['icd10_code'])
    op.create_index('idx_diagnoses_type', 'diagnoses', ['diagnosis_type'])
    op.create_index('idx_diagnoses_date', 'diagnoses', ['diagnosed_date'])


def downgrade():
    op.drop_table('diagnoses')
    op.execute('DROP TYPE IF EXISTS diagnosis_type_enum')
    op.execute('DROP TYPE IF EXISTS diagnosis_status_enum')
    op.execute('DROP TYPE IF EXISTS severity_enum')
