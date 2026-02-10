from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Vital(BaseModel):
    """Vital signs model"""
    __tablename__ = "vitals"
    
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Blood Pressure
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    
    # Other vitals
    pulse = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    
    # Body measurements
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    
    # Blood sugar
    blood_sugar = Column(Float, nullable=True)
    blood_sugar_type = Column(String(20), nullable=True)  # fasting, random, pp
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Recorded at (can be different from created_at)
    recorded_at = Column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    visit = relationship("Visit", back_populates="vitals")
    patient = relationship("Patient")
    recorder = relationship("User")
    
    def __repr__(self):
        return f"<Vital {self.id} - Visit {self.visit_id}>"
