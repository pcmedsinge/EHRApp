"""
Visit Number Generator
======================

Purpose:
    Generates unique visit numbers in format VIS-YYYY-NNNNN.
    Counter resets annually.

Module: app/utils/visit_number_generator.py
Phase: 2A (Visit Models)

References:
    - Phase 2A Spec: docs/phases/phase2/Phase2A_VisitModels.md
    - MRN Generator: app/utils/mrn_generator.py (similar pattern)

Format:
    VIS-YYYY-NNNNN
    - VIS: Fixed prefix
    - YYYY: 4-digit year
    - NNNNN: 5-digit sequence (padded with zeros)

Examples:
    - VIS-2026-00001 (first visit of 2026)
    - VIS-2026-00042 (42nd visit of 2026)
    - VIS-2027-00001 (first visit of 2027, counter reset)

Usage:
    from app.utils.visit_number_generator import VisitNumberGenerator
    
    visit_number = await VisitNumberGenerator.generate(db)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime


class VisitNumberGenerator:
    """
    Visit Number Generator.
    
    Generates unique visit identifiers with yearly reset.
    Thread-safe when used with database transaction.
    """
    
    PREFIX = "VIS"
    
    @classmethod
    async def generate(cls, db: AsyncSession) -> str:
        """
        Generate next visit number for current year.
        
        Args:
            db: Database session
            
        Returns:
            Generated visit number string (VIS-YYYY-NNNNN)
            
        Note:
            Must be called within a transaction to prevent duplicates.
            Consider using SELECT FOR UPDATE in high-concurrency scenarios.
        """
        # Import here to avoid circular imports
        from app.models.visit import Visit
        
        current_year = datetime.now().year
        
        # Get count of visits with current year pattern
        visit_pattern = f"{cls.PREFIX}-{current_year}-%"
        
        stmt = select(func.count(Visit.id)).where(
            Visit.visit_number.like(visit_pattern)
        )
        result = await db.execute(stmt)
        count = result.scalar() or 0
        
        # Next sequence number
        next_number = count + 1
        
        # Format: VIS-YYYY-NNNNN
        visit_number = f"{cls.PREFIX}-{current_year}-{next_number:05d}"
        
        return visit_number
    
    @classmethod
    def validate(cls, visit_number: str) -> bool:
        """
        Validate visit number format.
        
        Args:
            visit_number: Visit number string to validate
            
        Returns:
            True if valid format, False otherwise
        """
        if not visit_number:
            return False
            
        parts = visit_number.split("-")
        if len(parts) != 3:
            return False
            
        prefix, year, sequence = parts
        
        if prefix != cls.PREFIX:
            return False
            
        try:
            year_int = int(year)
            if year_int < 2020 or year_int > 2100:
                return False
        except ValueError:
            return False
            
        try:
            seq_int = int(sequence)
            if seq_int < 1 or seq_int > 99999:
                return False
        except ValueError:
            return False
            
        return True
    
    @classmethod
    def parse(cls, visit_number: str) -> dict:
        """
        Parse visit number into components.
        
        Args:
            visit_number: Visit number string
            
        Returns:
            Dictionary with prefix, year, sequence
            
        Raises:
            ValueError: If format is invalid
        """
        if not cls.validate(visit_number):
            raise ValueError(f"Invalid visit number format: {visit_number}")
            
        prefix, year, sequence = visit_number.split("-")
        
        return {
            "prefix": prefix,
            "year": int(year),
            "sequence": int(sequence),
            "full": visit_number
        }
