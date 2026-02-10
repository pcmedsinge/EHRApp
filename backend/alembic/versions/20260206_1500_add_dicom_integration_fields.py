"""add dicom integration fields

Revision ID: 20260206_1500
Revises: 292028e90ac7
Create Date: 2026-02-06 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260206_1500'
down_revision: Union[str, None] = '292028e90ac7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add DICOM integration fields for Phase 5A:
    1. Update orders table with DICOM fields
    2. Create dicom_upload_logs table
    """
    
    # Step 1: Update orders table with DICOM fields
    # Drop the old number_of_images column if it exists
    op.drop_column('orders', 'number_of_images')
    
    # Add new DICOM fields to orders table
    op.add_column('orders', sa.Column('orthanc_study_id', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('study_date', sa.String(length=20), nullable=True))
    op.add_column('orders', sa.Column('study_time', sa.String(length=20), nullable=True))
    op.add_column('orders', sa.Column('modality', sa.String(length=20), nullable=True))
    op.add_column('orders', sa.Column('number_of_series', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('number_of_instances', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('dicom_upload_date', sa.DateTime(timezone=True), nullable=True))
    
    # Create indexes on DICOM fields
    op.create_index('idx_orders_study_uid', 'orders', ['study_instance_uid'])
    op.create_index('idx_orders_orthanc_id', 'orders', ['orthanc_study_id'])
    
    # Step 2: Create dicom_upload_logs table
    op.create_table(
        'dicom_upload_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('study_instance_uid', sa.String(length=100), nullable=False),
        sa.Column('orthanc_study_id', sa.String(length=100), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_dicom_id', sa.String(length=100), nullable=True),
        sa.Column('patient_name', sa.String(length=200), nullable=True),
        sa.Column('study_date', sa.String(length=20), nullable=True),
        sa.Column('study_time', sa.String(length=20), nullable=True),
        sa.Column('study_description', sa.String(length=500), nullable=True),
        sa.Column('accession_number', sa.String(length=50), nullable=True),
        sa.Column('modality', sa.String(length=20), nullable=True),
        sa.Column('referring_physician', sa.String(length=200), nullable=True),
        sa.Column('upload_status', sa.String(length=20), nullable=False, server_default='uploaded'),
        sa.Column('file_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('upload_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('number_of_series', sa.Integer(), nullable=True),
        sa.Column('number_of_instances', sa.Integer(), nullable=True),
        sa.Column('deleted_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deletion_reason', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('study_instance_uid')
    )
    
    # Create indexes on dicom_upload_logs
    op.create_index('idx_dicom_study_uid', 'dicom_upload_logs', ['study_instance_uid'])
    op.create_index('idx_dicom_orthanc_id', 'dicom_upload_logs', ['orthanc_study_id'])
    op.create_index('idx_dicom_patient_id', 'dicom_upload_logs', ['patient_id'])
    op.create_index('idx_dicom_order_id', 'dicom_upload_logs', ['order_id'])
    op.create_index('idx_dicom_accession', 'dicom_upload_logs', ['accession_number'])
    op.create_index('idx_dicom_modality', 'dicom_upload_logs', ['modality'])
    op.create_index('idx_dicom_status', 'dicom_upload_logs', ['upload_status'])
    op.create_index('idx_dicom_patient_date', 'dicom_upload_logs', ['patient_id', 'study_date'])
    op.create_index('idx_dicom_order_uid', 'dicom_upload_logs', ['order_id', 'study_instance_uid'])
    op.create_index('idx_dicom_status_modality', 'dicom_upload_logs', ['upload_status', 'modality'])


def downgrade() -> None:
    """
    Rollback DICOM integration changes
    """
    # Drop dicom_upload_logs table
    op.drop_index('idx_dicom_status_modality', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_order_uid', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_patient_date', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_status', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_modality', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_accession', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_order_id', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_patient_id', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_orthanc_id', table_name='dicom_upload_logs')
    op.drop_index('idx_dicom_study_uid', table_name='dicom_upload_logs')
    op.drop_table('dicom_upload_logs')
    
    # Remove indexes from orders table
    op.drop_index('idx_orders_orthanc_id', table_name='orders')
    op.drop_index('idx_orders_study_uid', table_name='orders')
    
    # Remove DICOM columns from orders table
    op.drop_column('orders', 'dicom_upload_date')
    op.drop_column('orders', 'number_of_instances')
    op.drop_column('orders', 'number_of_series')
    op.drop_column('orders', 'modality')
    op.drop_column('orders', 'study_time')
    op.drop_column('orders', 'study_date')
    op.drop_column('orders', 'orthanc_study_id')
    
    # Add back the old number_of_images column
    op.add_column('orders', sa.Column('number_of_images', sa.Integer(), nullable=True))
