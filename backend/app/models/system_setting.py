"""
System Setting Model
====================

Purpose:
    Key-value store for system settings and feature flags.
    Enables runtime configuration without code changes.

Module: app/models/system_setting.py
Phase: 2A (Visit Models)

References:
    - Database Schema: docs/diagrams/database-schema.md
    - Phase 2A Spec: docs/phases/phase2/Phase2A_VisitModels.md

Feature Flags:
    - VISIT_QUEUE_ENABLED: Toggle queue management UI
    - VISIT_SCHEDULING_ENABLED: Toggle future appointment booking

Usage:
    # Get setting
    setting = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "VISIT_QUEUE_ENABLED")
    )
    
    # Check if enabled
    if setting.value == "true":
        # Show queue UI
"""

from sqlalchemy import Column, String, Text
from app.models.base import BaseModel


class SystemSetting(BaseModel):
    """
    System settings model for feature flags and configuration.
    
    Stores key-value pairs for runtime configuration.
    Category field allows grouping settings (e.g., features, display, limits).
    
    Attributes:
        key: Unique setting identifier (e.g., VISIT_QUEUE_ENABLED)
        value: Setting value as string (parsed by application)
        description: Human-readable description
        category: Grouping category (features, display, etc.)
    """
    
    __tablename__ = "system_settings"
    
    key = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="Setting key (unique identifier)"
    )
    
    value = Column(
        String(500),
        nullable=False,
        comment="Setting value"
    )
    
    description = Column(
        Text,
        nullable=True,
        comment="Human-readable description"
    )
    
    category = Column(
        String(50),
        nullable=True,
        index=True,
        default="general",
        comment="Category for grouping (features, display, limits)"
    )
    
    def __repr__(self) -> str:
        return f"<SystemSetting {self.key}={self.value}>"


# Default feature flags (inserted during migration)
DEFAULT_SETTINGS = [
    {
        "key": "VISIT_QUEUE_ENABLED",
        "value": "false",
        "description": "Enable real-time queue management UI",
        "category": "features"
    },
    {
        "key": "VISIT_SCHEDULING_ENABLED",
        "value": "false",
        "description": "Enable future date appointment scheduling",
        "category": "features"
    },
    {
        "key": "DEFAULT_VISIT_TYPE",
        "value": "consultation",
        "description": "Default visit type for new visits",
        "category": "defaults"
    },
    {
        "key": "DEFAULT_PRIORITY",
        "value": "normal",
        "description": "Default priority for new visits",
        "category": "defaults"
    },
]
