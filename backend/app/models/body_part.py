"""Body Part Reference Data"""
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID, JSON
from app.models.base import Base
import uuid


class BodyPart(Base):
    __tablename__ = "body_parts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    applicable_modalities = Column(JSON, nullable=False)  # ["XRAY", "CT", "MRI"]
