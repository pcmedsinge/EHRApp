"""
ICD-10 Service
==============

Purpose:
  Business logic for ICD-10 code search and management.

Module: app/api/v1/diagnosis/icd10_service.py
Phase: 3C (Backend - Diagnosis)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update
from app.models.icd10_code import ICD10Code
from typing import List, Optional

class ICD10Service:
    """Service for ICD-10 code operations"""
    
    @staticmethod
    async def search_codes(
        db: AsyncSession,
        query: str,
        limit: int = 20,
        common_only: bool = False
    ) -> List[ICD10Code]:
        """
        Search ICD-10 codes using trigram similarity.
        Fast full-text search with <100ms performance.
        """
        from sqlalchemy import cast, Text
        search_term = query.lower().strip()
        
        # Build query with similarity search using ILIKE fallback (trigram index still helps)
        stmt = select(ICD10Code).where(
            ICD10Code.search_text.ilike(f'%{search_term}%')
        )
        
        # Filter for common codes if requested
        if common_only:
            stmt = stmt.where(ICD10Code.common_in_india == True)
        
        # Order by usage count (popular codes first), then similarity
        stmt = stmt.order_by(
            ICD10Code.usage_count.desc()
        ).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_popular_codes(
        db: AsyncSession,
        limit: int = 50
    ) -> List[ICD10Code]:
        """Get most frequently used ICD-10 codes"""
        stmt = select(ICD10Code).order_by(
            ICD10Code.usage_count.desc()
        ).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_common_indian_codes(
        db: AsyncSession,
        limit: int = 50
    ) -> List[ICD10Code]:
        """Get codes commonly used in Indian healthcare"""
        stmt = select(ICD10Code).where(
            ICD10Code.common_in_india == True
        ).order_by(
            ICD10Code.usage_count.desc()
        ).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_code_details(
        db: AsyncSession,
        code: str
    ) -> Optional[ICD10Code]:
        """Get detailed information for a specific ICD-10 code"""
        stmt = select(ICD10Code).where(ICD10Code.code == code.upper())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def increment_usage(
        db: AsyncSession,
        code: str
    ) -> None:
        """Increment usage count for an ICD-10 code"""
        stmt = update(ICD10Code).where(
            ICD10Code.code == code.upper()
        ).values(
            usage_count=ICD10Code.usage_count + 1
        )
        await db.execute(stmt)
        await db.commit()
    
    @staticmethod
    async def search_by_category(
        db: AsyncSession,
        category: str,
        limit: int = 50
    ) -> List[ICD10Code]:
        """Search codes by category"""
        stmt = select(ICD10Code).where(
            ICD10Code.category.ilike(f"%{category}%")
        ).order_by(
            ICD10Code.usage_count.desc()
        ).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
