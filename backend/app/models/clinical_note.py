"""
Clinical Notes Model

Stores clinical documentation in SOAP format with locking/signing capability.
Phase: 3E (Clinical Notes Backend)
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class ClinicalNote(BaseModel):
    """
    Clinical note model with SOAP format.
    
    SOAP = Subjective, Objective, Assessment, Plan
    """
    __tablename__ = "clinical_notes"
    
    # Foreign Keys
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    # Note type
    note_type = Column(String(20), nullable=False, default="soap")  # soap, progress, discharge, consultation, procedure
    
    # SOAP Content
    subjective = Column(Text, nullable=True)  # Chief complaint, HPI, symptoms reported by patient
    objective = Column(Text, nullable=True)   # Physical examination, vitals, lab results
    assessment = Column(Text, nullable=True)  # Diagnosis, clinical impression
    plan = Column(Text, nullable=True)        # Treatment plan, medications, orders, follow-up
    
    # Metadata
    title = Column(String(200), nullable=True)
    template_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Primary note flag (one primary per visit, allows addendums)
    is_primary = Column(Boolean, nullable=False, default=False)
    
    # Locking/Signing
    is_locked = Column(Boolean, nullable=False, default=False)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    locked_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    visit = relationship("Visit", back_populates="clinical_notes")
    patient = relationship("Patient")
    author = relationship("User", foreign_keys=[created_by])
    signer = relationship("User", foreign_keys=[locked_by])
    
    def __repr__(self):
        return f"<ClinicalNote(id={self.id}, visit_id={self.visit_id}, note_type={self.note_type}, locked={self.is_locked})>"


class NoteTemplate(BaseModel):
    """
    Template for quick clinical note creation.
    """
    __tablename__ = "note_templates"
    
    name = Column(String(200), nullable=False)
    note_type = Column(String(20), nullable=False)  # soap, progress, discharge, etc.
    specialty = Column(String(100), nullable=True)  # General, Cardiology, etc.
    
    # Template content
    subjective_template = Column(Text, nullable=True)
    objective_template = Column(Text, nullable=True)
    assessment_template = Column(Text, nullable=True)
    plan_template = Column(Text, nullable=True)
    
    # Metadata
    is_active = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    creator = relationship("User")
    
    def __repr__(self):
        return f"<NoteTemplate(id={self.id}, name={self.name}, type={self.note_type})>"
