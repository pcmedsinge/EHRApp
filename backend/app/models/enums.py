"""
Visit-Related Enums
===================

Purpose:
    Enumeration definitions for the Visit module.
    Defines status, type, and priority values.

Module: app/models/enums.py
Phase: 2A (Visit Models)

References:
    - Database Schema: docs/diagrams/database-schema.md
    - Phase 2A Spec: docs/phases/phase2/Phase2A_VisitModels.md

Used By:
    - app/models/visit.py (Visit model)
    - app/schemas/visit.py (Pydantic schemas)
    - app/services/visit_service.py (Business logic)

Status Flow:
    REGISTERED → WAITING → IN_PROGRESS → COMPLETED
         ↓           ↓           ↓
    ←——————————— CANCELLED ——————————→
"""

from enum import Enum


class VisitStatus(str, Enum):
    """
    Visit status enumeration.
    
    Defines the lifecycle states of a patient visit.
    Status transitions are validated in the service layer.
    
    Flow:
        registered → waiting → in_progress → completed
        Any state can transition to cancelled
    """
    REGISTERED = "registered"      # Patient checked in at front desk
    WAITING = "waiting"            # Patient in waiting area
    IN_PROGRESS = "in_progress"    # Consultation in progress
    COMPLETED = "completed"        # Consultation finished
    CANCELLED = "cancelled"        # Visit cancelled


class VisitType(str, Enum):
    """
    Visit type enumeration.
    
    Categorizes the purpose of the visit.
    """
    CONSULTATION = "consultation"  # New problem / first visit
    FOLLOW_UP = "follow_up"        # Follow-up for existing problem
    EMERGENCY = "emergency"        # Emergency visit
    PROCEDURE = "procedure"        # Scheduled procedure or test


class Priority(str, Enum):
    """
    Visit priority enumeration.
    
    Determines queue ordering and urgency.
    """
    NORMAL = "normal"        # Standard priority
    URGENT = "urgent"        # Needs attention soon
    EMERGENCY = "emergency"  # Immediate attention required


# Status transition rules (used by visit_service.py)
ALLOWED_STATUS_TRANSITIONS = {
    VisitStatus.REGISTERED: [VisitStatus.WAITING, VisitStatus.CANCELLED],
    VisitStatus.WAITING: [VisitStatus.IN_PROGRESS, VisitStatus.CANCELLED],
    VisitStatus.IN_PROGRESS: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
    VisitStatus.COMPLETED: [],  # Terminal state
    VisitStatus.CANCELLED: [],  # Terminal state
}
