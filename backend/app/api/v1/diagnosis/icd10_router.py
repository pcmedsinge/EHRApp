"""
ICD-10 API Router
=================

Purpose:
  API endpoints for ICD-10 code search and retrieval.

Module: app/api/v1/diagnosis/icd10_router.py
Phase: 3C (Backend - Diagnosis)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.api.v1.diagnosis.icd10_service import ICD10Service
from app.schemas.diagnosis import ICD10SearchResult, ICD10CodeDetail
from typing import List

router = APIRouter()

@router.get("/search", response_model=List[ICD10SearchResult])
async def search_icd10_codes(
    query: str = Query(..., min_length=2, description="Search term (minimum 2 characters)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    common_only: bool = Query(False, description="Show only common Indian diagnoses"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Search ICD-10 codes by term.
    Fast full-text search with trigram matching.
    
    - **query**: Search term (disease name, code, etc.)
    - **limit**: Max results (default: 20)
    - **common_only**: Filter for common Indian diagnoses
    """
    codes = await ICD10Service.search_codes(
        db=db,
        query=query,
        limit=limit,
        common_only=common_only
    )
    return codes

@router.get("/popular", response_model=List[ICD10SearchResult])
async def get_popular_codes(
    limit: int = Query(50, ge=1, le=100, description="Maximum results"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get most frequently used ICD-10 codes.
    Sorted by usage count (most popular first).
    """
    codes = await ICD10Service.get_popular_codes(db=db, limit=limit)
    return codes

@router.get("/common-indian", response_model=List[ICD10SearchResult])
async def get_common_indian_codes(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get ICD-10 codes commonly used in Indian healthcare.
    Pre-marked during database seeding.
    """
    codes = await ICD10Service.get_common_indian_codes(db=db, limit=limit)
    return codes

@router.get("/category/{category}", response_model=List[ICD10SearchResult])
async def search_by_category(
    category: str,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Search ICD-10 codes by category.
    
    - **category**: Category name (e.g., "Diabetes", "Infectious")
    """
    codes = await ICD10Service.search_by_category(
        db=db,
        category=category,
        limit=limit
    )
    return codes

@router.get("/{code}", response_model=ICD10CodeDetail)
async def get_code_details(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get detailed information for a specific ICD-10 code.
    
    - **code**: ICD-10 code (e.g., "E11.9")
    """
    from fastapi import HTTPException, status
    
    icd10 = await ICD10Service.get_code_details(db=db, code=code)
    
    if not icd10:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ICD-10 code not found: {code}"
        )
    
    return icd10
