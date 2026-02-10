"""Create vitals table

Revision ID: b1c2d3e4f5a6
Revises: 20260203_seed_users
Create Date: 2026-02-03 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5a6'
down_revision = '20260203_seed_users'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'vitals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('visit_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('visits.id'), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        
        # Blood Pressure
        sa.Column('bp_systolic', sa.Integer, nullable=True),
        sa.Column('bp_diastolic', sa.Integer, nullable=True),
        
        # Other vitals
        sa.Column('pulse', sa.Integer, nullable=True),
        sa.Column('temperature', sa.Float, nullable=True),
        sa.Column('respiratory_rate', sa.Integer, nullable=True),
        sa.Column('spo2', sa.Integer, nullable=True),
        
        # Body measurements
        sa.Column('height_cm', sa.Float, nullable=True),
        sa.Column('weight_kg', sa.Float, nullable=True),
        sa.Column('bmi', sa.Float, nullable=True),
        
        # Blood sugar
        sa.Column('blood_sugar', sa.Float, nullable=True),
        sa.Column('blood_sugar_type', sa.String(20), nullable=True),  # fasting, random, pp
        
        # Notes
        sa.Column('notes', sa.Text, nullable=True),
        
        # Audit fields
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_deleted', sa.Boolean, default=False)
    )
    
    # Create indexes for faster queries
    op.create_index('idx_vitals_visit', 'vitals', ['visit_id'])
    op.create_index('idx_vitals_patient', 'vitals', ['patient_id'])
    op.create_index('idx_vitals_recorded_at', 'vitals', ['recorded_at'])


def downgrade():
    op.drop_index('idx_vitals_recorded_at', 'vitals')
    op.drop_index('idx_vitals_patient', 'vitals')
    op.drop_index('idx_vitals_visit', 'vitals')
    op.drop_table('vitals')
