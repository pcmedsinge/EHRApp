"""
ICD-10 Code Model
=================

Purpose:
  ICD-10 code reference table for diagnosis coding.

Module: app/models/icd10_code.py
Phase: 3C (Backend - Diagnosis)
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class ICD10Code(Base):
    """ICD-10 code reference model"""
    __tablename__ = "icd10_codes"
    
    code = Column(String(10), primary_key=True)
    description = Column(Text, nullable=False)
    category = Column(String(100))
    subcategory = Column(String(100))
    search_text = Column(Text)
    usage_count = Column(Integer, default=0)
    common_in_india = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<ICD10Code {self.code}: {self.description[:50]}>"
