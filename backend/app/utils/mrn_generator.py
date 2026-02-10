from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.models.patient import Patient


class MRNGenerator:
    """
    Medical Record Number (MRN) Generator
    
    Format: CLI-YYYY-NNNNN
    Example: CLI-2026-00001
    
    Sequence resets annually.
    """
    
    PREFIX = "CLI"
    
    @classmethod
    async def generate(cls, db: AsyncSession) -> str:
        """
        Generate next MRN for current year.
        
        Args:
            db: Database session
            
        Returns:
            Generated MRN string
        """
        current_year = datetime.now().year
        
        # Get the count of patients created in current year
        # Filter by MRN pattern for current year
        mrn_pattern = f"{cls.PREFIX}-{current_year}-%"
        
        stmt = select(func.count(Patient.id)).where(
            Patient.mrn.like(mrn_pattern)
        )
        result = await db.execute(stmt)
        count = result.scalar() or 0
        
        # Next sequence number
        next_number = count + 1
        
        # Format: CLI-YYYY-NNNNN
        mrn = f"{cls.PREFIX}-{current_year}-{next_number:05d}"
        
        return mrn
    
    @classmethod
    def validate(cls, mrn: str) -> bool:
        """
        Validate MRN format.
        
        Args:
            mrn: MRN string to validate
            
        Returns:
            True if valid format
        """
        import re
        pattern = rf"^{cls.PREFIX}-\d{{4}}-\d{{5}}$"
        return bool(re.match(pattern, mrn))
