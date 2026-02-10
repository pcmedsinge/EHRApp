"""
User Model
==========

Purpose:
    SQLAlchemy model for user accounts.
    Handles authentication and role-based authorization.

Module: app/models/user.py
Phase: 1C (Auth Backend)

References:
    - Database Schema: docs/diagrams/database-schema.md
    - Auth Flow: docs/phases/phase1/diagrams/auth-flow.md
    - Phase 1C Spec: docs/phases/phase1/Phase1C_AuthBackend.md

Roles:
    - admin: Full system access, user management
    - doctor: Patient access, clinical documentation
    - nurse: Patient access, vitals, basic documentation
    - receptionist: Patient registration, visit management

Relationships:
    - Patient (created_by, updated_by) - Audit trail
    - Visit (assigned_doctor) - Doctor assignments [Phase 2]
"""

from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    """
    User role enumeration for RBAC.
    
    Values:
        ADMIN: System administrator with full access
        DOCTOR: Physician with clinical privileges
        NURSE: Nursing staff with limited clinical access
        RECEPTIONIST: Front desk with patient/visit management
    """
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"


class User(BaseModel):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    
    password_hash = Column(
        String(255),
        nullable=False,
    )
    
    full_name = Column(
        String(100),
        nullable=False,
    )
    
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.RECEPTIONIST,
    )
    
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
