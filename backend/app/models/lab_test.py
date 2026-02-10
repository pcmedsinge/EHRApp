"""Lab Test Reference Data"""
from sqlalchemy import Column, String, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import uuid


class LabTest(Base):
    __tablename__ = "lab_tests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    specimen_type = Column(String(50), nullable=False)
    fasting_required = Column(Boolean, default=False)
    tat_hours = Column(Integer, nullable=True)  # Turnaround time
    is_active = Column(Boolean, default=True)
