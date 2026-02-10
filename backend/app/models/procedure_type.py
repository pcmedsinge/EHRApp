"""Procedure Type Reference Data"""
from sqlalchemy import Column, String, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import uuid


class ProcedureType(Base):
    __tablename__ = "procedure_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    requires_consent = Column(Boolean, default=False)
    estimated_duration = Column(Integer, nullable=True)  # minutes
    is_active = Column(Boolean, default=True)
