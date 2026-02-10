"""
Base Model
==========

Purpose:
    Abstract base class for all SQLAlchemy models.
    Provides common fields: id, timestamps, soft delete.

Module: app/models/base.py
Phase: 1B (Backend Core)

References:
    - Database Schema: docs/diagrams/database-schema.md
    - Backend Structure: docs/phases/phase1/diagrams/infrastructure.md

Inherited By:
    - User (Phase 1C)
    - Patient (Phase 1D)
    - Visit (Phase 2A)
    - SystemSetting (Phase 2A)

Common Fields:
    - id: UUID primary key (auto-generated)
    - created_at: Timestamp of creation
    - updated_at: Timestamp of last update
    - is_deleted: Soft delete flag
"""

from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class BaseModel(Base):
    """
    Abstract base model with common fields.
    
    All database models should inherit from this class to ensure
    consistent field names and behavior across the application.
    
    Usage:
        class MyModel(BaseModel):
            __tablename__ = "my_table"
            my_field = Column(String)
    """
    __abstract__ = True
    
    id = Column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True,
    )
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
