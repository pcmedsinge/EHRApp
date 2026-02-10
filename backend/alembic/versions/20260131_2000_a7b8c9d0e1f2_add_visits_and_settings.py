"""Add visits and system_settings tables

Revision ID: a7b8c9d0e1f2
Revises: c3a64146b522
Create Date: 2026-01-31 20:00:00.000000

Phase: 2A (Visit Models)

Tables Created:
    - visits: Patient visit/appointment tracking
    - system_settings: Feature flags and configuration

References:
    - Phase 2A Spec: docs/phases/phase2/Phase2A_VisitModels.md
    - Database Schema: docs/diagrams/database-schema.md
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a7b8c9d0e1f2'
down_revision = 'c3a64146b522'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ==========================================================================
    # Create system_settings table
    # ==========================================================================
    op.create_table(
        'system_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True, default='general'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Create indexes for system_settings
    op.create_index('ix_system_settings_key', 'system_settings', ['key'], unique=True)
    op.create_index('ix_system_settings_category', 'system_settings', ['category'])
    
    # ==========================================================================
    # Create visit status, type, and priority enums using raw SQL
    # (More reliable than SQLAlchemy ENUM for async/Alembic)
    # ==========================================================================
    op.execute("CREATE TYPE visitstatus AS ENUM ('registered', 'waiting', 'in_progress', 'completed', 'cancelled')")
    op.execute("CREATE TYPE visittype AS ENUM ('consultation', 'follow_up', 'emergency', 'procedure')")
    op.execute("CREATE TYPE priority AS ENUM ('normal', 'urgent', 'emergency')")
    
    # ==========================================================================
    # Create visits table using raw SQL to avoid SQLAlchemy enum issues
    # ==========================================================================
    op.execute("""
        CREATE TABLE visits (
            id UUID PRIMARY KEY,
            visit_number VARCHAR(20) NOT NULL,
            patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
            assigned_doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
            visit_date DATE NOT NULL,
            visit_type visittype NOT NULL DEFAULT 'consultation',
            status visitstatus NOT NULL DEFAULT 'registered',
            priority priority NOT NULL DEFAULT 'normal',
            department VARCHAR(100),
            chief_complaint TEXT,
            check_in_time TIMESTAMPTZ,
            consultation_start_time TIMESTAMPTZ,
            consultation_end_time TIMESTAMPTZ,
            cancellation_reason TEXT,
            notes TEXT,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            is_deleted BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)
    
    # Create indexes for visits
    op.create_index('ix_visits_visit_number', 'visits', ['visit_number'], unique=True)
    op.create_index('ix_visits_patient_id', 'visits', ['patient_id'])
    op.create_index('ix_visits_assigned_doctor_id', 'visits', ['assigned_doctor_id'])
    op.create_index('ix_visits_visit_date', 'visits', ['visit_date'])
    op.create_index('ix_visits_status', 'visits', ['status'])
    op.create_index('ix_visits_is_deleted', 'visits', ['is_deleted'])
    
    # Composite index for common queries
    op.create_index('ix_visits_date_status', 'visits', ['visit_date', 'status'])
    
    # ==========================================================================
    # Insert default feature flags
    # ==========================================================================
    op.execute("""
        INSERT INTO system_settings (id, key, value, description, category, created_at, updated_at, is_deleted)
        VALUES 
            (gen_random_uuid(), 'VISIT_QUEUE_ENABLED', 'false', 'Enable real-time queue management UI', 'features', NOW(), NOW(), false),
            (gen_random_uuid(), 'VISIT_SCHEDULING_ENABLED', 'false', 'Enable future date appointment scheduling', 'features', NOW(), NOW(), false),
            (gen_random_uuid(), 'DEFAULT_VISIT_TYPE', 'consultation', 'Default visit type for new visits', 'defaults', NOW(), NOW(), false),
            (gen_random_uuid(), 'DEFAULT_PRIORITY', 'normal', 'Default priority for new visits', 'defaults', NOW(), NOW(), false)
    """)


def downgrade() -> None:
    # Drop visits table
    op.drop_index('ix_visits_date_status', table_name='visits')
    op.drop_index('ix_visits_is_deleted', table_name='visits')
    op.drop_index('ix_visits_status', table_name='visits')
    op.drop_index('ix_visits_visit_date', table_name='visits')
    op.drop_index('ix_visits_assigned_doctor_id', table_name='visits')
    op.drop_index('ix_visits_patient_id', table_name='visits')
    op.drop_index('ix_visits_visit_number', table_name='visits')
    op.drop_table('visits')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS visitstatus')
    op.execute('DROP TYPE IF EXISTS visittype')
    op.execute('DROP TYPE IF EXISTS priority')
    
    # Drop system_settings table
    op.drop_index('ix_system_settings_category', table_name='system_settings')
    op.drop_index('ix_system_settings_key', table_name='system_settings')
    op.drop_table('system_settings')
