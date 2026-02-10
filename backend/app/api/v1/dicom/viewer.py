"""
DICOM Viewer API Router
Phase: 5C (Viewer Integration)

Endpoints for generating OHIF Viewer URLs for studies, orders, and patients.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.api.v1.auth.router import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.patient import Patient
from app.services.orthanc_service import orthanc_service
from app.core.config import settings

router = APIRouter()


@router.get("/url/{study_uid}")
async def get_viewer_url(
    study_uid: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get OHIF Viewer URL for a specific study
    
    Args:
        study_uid: Study Instance UID
        
    Returns:
        dict: Viewer URL and study information
    """
    # Verify study exists in Orthanc
    try:
        study = await orthanc_service.get_study(study_uid)
        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study not found in PACS"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study not found: {str(e)}"
        )
    
    # Build OHIF Viewer URL
    viewer_base = settings.OHIF_VIEWER_URL
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={study_uid}"
    
    return {
        "url": viewer_url,
        "study_uid": study_uid,
        "study": study
    }


@router.get("/url/order/{order_id}")
async def get_viewer_url_for_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get OHIF Viewer URL for an order's study
    
    Args:
        order_id: Order UUID
        
    Returns:
        dict: Viewer URL and order information
    """
    # Get order
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order has study
    if not order.study_instance_uid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No DICOM study uploaded for this order"
        )
    
    # Build viewer URL
    viewer_base = settings.OHIF_VIEWER_URL
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={order.study_instance_uid}"
    
    return {
        "url": viewer_url,
        "study_uid": order.study_instance_uid,
        "order_id": str(order_id),
        "order_number": order.order_number
    }


@router.get("/url/patient/{patient_id}")
async def get_viewer_url_for_patient_studies(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get OHIF Viewer URL for all patient studies
    
    Args:
        patient_id: Patient UUID
        
    Returns:
        dict: Viewer URL with all patient study UIDs
    """
    # Get patient
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Get all studies for patient from Orthanc
    try:
        studies = await orthanc_service.query_patient_studies(patient.mrn)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query patient studies: {str(e)}"
        )
    
    if not studies:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No studies found for patient"
        )
    
    # Extract study UIDs
    study_uids = []
    for study in studies:
        main_tags = study.get("MainDicomTags", {})
        study_uid = main_tags.get("StudyInstanceUID")
        if study_uid:
            study_uids.append(study_uid)
    
    if not study_uids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid study UIDs found"
        )
    
    # Build viewer URL with multiple studies
    viewer_base = settings.OHIF_VIEWER_URL
    study_params = ",".join(study_uids)
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={study_params}"
    
    return {
        "url": viewer_url,
        "study_uids": study_uids,
        "study_count": len(study_uids),
        "patient_id": str(patient_id),
        "patient_mrn": patient.mrn
    }


@router.get("/compare")
async def get_comparison_viewer_url(
    study_uids: str,  # Comma-separated study UIDs
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get OHIF Viewer URL for comparing multiple studies
    
    Args:
        study_uids: Comma-separated study UIDs (e.g., "uid1,uid2,uid3")
        
    Returns:
        dict: Viewer URL for study comparison
    """
    uid_list = [uid.strip() for uid in study_uids.split(",") if uid.strip()]
    
    if len(uid_list) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 studies required for comparison"
        )
    
    # Verify all studies exist
    missing_studies = []
    for uid in uid_list:
        try:
            study = await orthanc_service.get_study(uid)
            if not study:
                missing_studies.append(uid)
        except Exception:
            missing_studies.append(uid)
    
    if missing_studies:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Studies not found: {', '.join(missing_studies)}"
        )
    
    # Build comparison URL
    viewer_base = settings.OHIF_VIEWER_URL
    study_params = ",".join(uid_list)
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={study_params}"
    
    return {
        "url": viewer_url,
        "study_uids": uid_list,
        "study_count": len(uid_list)
    }


@router.get("/config")
async def get_viewer_config(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get OHIF Viewer configuration
    
    Returns:
        dict: Viewer base URL and settings
    """
    return {
        "viewer_url": settings.OHIF_VIEWER_URL,
        "orthanc_url": settings.ORTHANC_URL,
        "dicomweb_url": settings.ORTHANC_DICOMWEB_URL,
        "max_studies_comparison": 10
    }
