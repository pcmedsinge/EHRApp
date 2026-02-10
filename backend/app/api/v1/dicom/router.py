"""
DICOM API Router
================

Purpose:
    API endpoints for DICOM file upload, query, tag operations, and viewer integration.
    Integrates with Orthanc PACS and manages DICOM upload logs.

Module: app/api/v1/dicom/router.py
Phase: 5A (Orthanc Backend)

Endpoints:
    Upload:
        - POST /upload: Upload single DICOM file
        - POST /upload-multiple: Upload multiple DICOM files
        - POST /upload-zip: Upload ZIP archive of DICOM files
    
    Tag Operations:
        - POST /read-tags: Read DICOM tags from file
        - POST /modify-tags: Modify DICOM tags
        - POST /validate: Validate DICOM file
    
    Query:
        - GET /studies: List all studies
        - GET /studies/{study_uid}: Get study by UID
        - GET /studies/patient/{patient_id}: Get patient's studies
        - GET /studies/order/{order_id}: Get order's studies
        - GET /studies/accession/{accession_number}: Find by accession number
    
    Management:
        - DELETE /studies/{study_uid}: Delete study
        - GET /studies/{study_uid}/thumbnail: Get study thumbnail
        - GET /health: Orthanc health check
        - GET /statistics: Orthanc system statistics
    
    Upload Logs:
        - GET /upload-logs: List upload logs
        - GET /upload-logs/{log_id}: Get specific log
        - GET /upload-logs/patient/{patient_id}: Patient's upload logs
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import zipfile
from io import BytesIO

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.order import Order
from app.models.dicom_upload_log import DicomUploadLog
from app.services.orthanc_service import orthanc_service
from app.services.dicom_tag_service import dicom_tag_service
from app.schemas.dicom import (
    DicomTagsResponse,
    DicomUploadResponse,
    DicomUploadMultipleResponse,
    DicomFileInfo,
    DicomStudyResponse,
    DicomUploadLogResponse,
    DicomTagModifyRequest,
    DicomDeleteRequest,
    DicomHealthResponse,
    DicomStatisticsResponse,
    PatientStudiesResponse,
    OrderStudiesResponse,
)
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dicom", tags=["dicom"])


# ====================
# UPLOAD ENDPOINTS
# ====================

@router.post("/upload", response_model=DicomUploadResponse)
async def upload_dicom_file(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    order_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a single DICOM file to Orthanc PACS
    
    - **file**: DICOM file (.dcm)
    - **patient_id**: Patient UUID
    - **order_id**: Optional order UUID
    
    Returns upload confirmation with study information
    """
    try:
        # Convert string UUIDs
        patient_uuid = UUID(patient_id)
        order_uuid = UUID(order_id) if order_id else None
        
        # Initialize order variable
        order = None
        
        # Validate patient exists
        patient = await db.get(Patient, patient_uuid)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Validate order if provided
        if order_uuid:
            order = await db.get(Order, order_uuid)
            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )
            if order.patient_id != patient_uuid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Order does not belong to specified patient"
                )
        
        # Read file content
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        
        # Check file size limit
        if file_size_mb > settings.MAX_DICOM_FILE_SIZE_MB:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size ({file_size_mb:.2f}MB) exceeds limit ({settings.MAX_DICOM_FILE_SIZE_MB}MB)"
            )
        
        # Validate DICOM file
        is_valid = dicom_tag_service.validate_dicom(file_content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a valid DICOM file"
            )
        
        # Read DICOM tags
        tags = dicom_tag_service.read_tags(file_content)
        
        # Upload to Orthanc
        upload_result = await orthanc_service.upload_dicom(file_content)
        orthanc_study_id = upload_result.get("ParentStudy")
        
        if not orthanc_study_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get study ID from Orthanc"
            )
        
        # Get study statistics from Orthanc
        study_stats = await orthanc_service.get_study_statistics(orthanc_study_id)
        
        # Create upload log
        upload_log = DicomUploadLog(
            study_instance_uid=tags.get("StudyInstanceUID"),
            orthanc_study_id=orthanc_study_id,
            patient_id=patient_uuid,
            order_id=order_uuid,
            uploaded_by=current_user.id,
            patient_dicom_id=tags.get("PatientID"),
            patient_name=tags.get("PatientName"),
            study_date=tags.get("StudyDate"),
            study_time=tags.get("StudyTime"),
            study_description=tags.get("StudyDescription"),
            accession_number=tags.get("AccessionNumber"),
            modality=tags.get("Modality"),
            referring_physician=tags.get("ReferringPhysicianName"),
            upload_status="uploaded",
            file_count=1,
            total_size_bytes=len(file_content),
            number_of_series=study_stats.get("CountSeries") if study_stats else None,
            number_of_instances=study_stats.get("CountInstances") if study_stats else None,
        )
        
        db.add(upload_log)
        
        # Update order if provided
        if order_uuid and order:
            order.study_instance_uid = tags.get("StudyInstanceUID")
            order.orthanc_study_id = orthanc_study_id
            order.study_date = tags.get("StudyDate")
            order.study_time = tags.get("StudyTime")
            order.modality = tags.get("Modality")
            order.number_of_series = study_stats.get("CountSeries") if study_stats else None
            order.number_of_instances = study_stats.get("CountInstances") if study_stats else None
            order.dicom_upload_date = datetime.utcnow()
            logger.info(f"Updating order {order.order_number} with study UID {tags.get('StudyInstanceUID')}")
        
        await db.commit()
        await db.refresh(upload_log)
        
        logger.info(f"DICOM uploaded: Study {tags.get('StudyInstanceUID')} for patient {patient_uuid}")
        
        return DicomUploadResponse(
            study_instance_uid=upload_log.study_instance_uid,
            orthanc_study_id=upload_log.orthanc_study_id,
            patient_id=upload_log.patient_id,
            order_id=upload_log.order_id,
            upload_log_id=upload_log.id,
            modality=upload_log.modality,
            study_date=upload_log.study_date,
            number_of_series=upload_log.number_of_series,
            number_of_instances=upload_log.number_of_instances,
            file_count=upload_log.file_count,
            total_size_mb=round(upload_log.total_size_bytes / (1024 * 1024), 2),
            upload_date=upload_log.upload_date,
            status=upload_log.upload_status,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading DICOM: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload DICOM file: {str(e)}"
        )


@router.post("/upload-multiple", response_model=DicomUploadMultipleResponse)
async def upload_multiple_dicom_files(
    files: List[UploadFile] = File(...),
    patient_id: str = Form(...),
    order_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload multiple DICOM files to Orthanc PACS
    
    - **files**: List of DICOM files
    - **patient_id**: Patient UUID
    - **order_id**: Optional order UUID
    
    Returns upload statistics and details for each file
    """
    # Check file count limit
    if len(files) > settings.MAX_DICOM_FILES_PER_UPLOAD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Too many files ({len(files)}). Maximum is {settings.MAX_DICOM_FILES_PER_UPLOAD}"
        )
    
    uploads = []
    successful = 0
    failed = 0
    study_uids = set()
    errors = []
    
    for idx, file in enumerate(files):
        try:
            # Use the single upload endpoint logic
            result = await upload_dicom_file(
                file=file,
                patient_id=patient_id,
                order_id=order_id,
                current_user=current_user,
                db=db
            )
            uploads.append(result)
            successful += 1
            study_uids.add(result.study_instance_uid)
            
        except Exception as e:
            failed += 1
            error_msg = f"File {idx+1} ({file.filename}): {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg)
    
    return DicomUploadMultipleResponse(
        total_files=len(files),
        successful=successful,
        failed=failed,
        studies=list(study_uids),
        uploads=uploads,
        errors=errors if errors else None,
    )


# ====================
# TAG OPERATIONS
# ====================

@router.post("/read-tags", response_model=DicomTagsResponse)
async def read_dicom_tags(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Read DICOM tags from file without uploading
    
    Useful for previewing file contents before upload
    """
    try:
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        
        # Validate DICOM
        is_valid = dicom_tag_service.validate_dicom(file_content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a valid DICOM file"
            )
        
        # Read tags
        tags = dicom_tag_service.read_tags(file_content)
        
        return DicomTagsResponse(
            tags=tags,
            file_name=file.filename,
            file_size_mb=round(file_size_mb, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading DICOM tags: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read DICOM tags: {str(e)}"
        )


@router.post("/modify-tags")
async def modify_dicom_tags(
    file: UploadFile = File(...),
    tag_modifications: str = Form(...),  # JSON string
    current_user: User = Depends(get_current_user)
):
    """
    Modify DICOM tags and return modified file
    
    - **file**: Original DICOM file
    - **tag_modifications**: JSON string of tag modifications
        Example: '{"PatientName": "DOE^JOHN", "PatientID": "12345"}'
    
    Returns the modified DICOM file
    """
    try:
        import json
        
        # Parse tag modifications
        try:
            tag_updates = json.loads(tag_modifications)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON in tag_modifications"
            )
        
        file_content = await file.read()
        
        # Validate DICOM
        is_valid = dicom_tag_service.validate_dicom(file_content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a valid DICOM file"
            )
        
        # Modify tags
        modified_content = dicom_tag_service.modify_tags(file_content, tag_updates)
        
        # Return modified file
        return Response(
            content=modified_content,
            media_type="application/dicom",
            headers={
                "Content-Disposition": f"attachment; filename=modified_{file.filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error modifying DICOM tags: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to modify DICOM tags: {str(e)}"
        )


@router.post("/validate")
async def validate_dicom_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Validate if file is a proper DICOM file
    
    Returns validation result and basic file info
    """
    try:
        file_content = await file.read()
        
        is_valid = dicom_tag_service.validate_dicom(file_content)
        
        if is_valid:
            file_info = dicom_tag_service.get_file_info(file_content)
            return {
                "valid": True,
                "message": "File is a valid DICOM file",
                "file_info": file_info
            }
        else:
            return {
                "valid": False,
                "message": "File is not a valid DICOM file"
            }
        
    except Exception as e:
        logger.error(f"Error validating DICOM: {str(e)}")
        return {
            "valid": False,
            "message": f"Validation error: {str(e)}"
        }


# ====================
# QUERY ENDPOINTS
# ====================

@router.get("/studies", response_model=List[DicomUploadLogResponse])
async def list_studies(
    skip: int = 0,
    limit: int = 100,
    modality: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all DICOM studies with optional filtering
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **modality**: Filter by modality (CT, MR, CR, etc.)
    """
    query = select(DicomUploadLog).where(DicomUploadLog.is_deleted == False)
    
    if modality:
        query = query.where(DicomUploadLog.modality == modality.upper())
    
    query = query.order_by(DicomUploadLog.upload_date.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    studies = result.scalars().all()
    
    return [DicomUploadLogResponse.model_validate(study) for study in studies]


@router.get("/studies/{study_uid}", response_model=DicomUploadLogResponse)
async def get_study(
    study_uid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get study by StudyInstanceUID
    """
    result = await db.execute(
        select(DicomUploadLog).where(
            and_(
                DicomUploadLog.study_instance_uid == study_uid,
                DicomUploadLog.is_deleted == False
            )
        )
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    return DicomUploadLogResponse.model_validate(study)


@router.get("/studies/patient/{patient_id}", response_model=List[DicomUploadLogResponse])
async def get_patient_studies(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all studies for a patient
    """
    # Verify patient exists
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    result = await db.execute(
        select(DicomUploadLog).where(
            and_(
                DicomUploadLog.patient_id == patient_id,
                DicomUploadLog.is_deleted == False
            )
        ).order_by(DicomUploadLog.study_date.desc())
    )
    studies = result.scalars().all()
    
    return [DicomUploadLogResponse.model_validate(study) for study in studies]


@router.get("/studies/order/{order_id}", response_model=List[DicomUploadLogResponse])
async def get_order_studies(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get studies associated with an order
    """
    # Verify order exists
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    result = await db.execute(
        select(DicomUploadLog).where(
            and_(
                DicomUploadLog.order_id == order_id,
                DicomUploadLog.is_deleted == False
            )
        ).order_by(DicomUploadLog.upload_date.desc())
    )
    studies = result.scalars().all()
    
    return [DicomUploadLogResponse.model_validate(study) for study in studies]


# ====================
# MANAGEMENT ENDPOINTS
# ====================

@router.delete("/studies/{study_uid}")
async def delete_study(
    study_uid: str,
    delete_request: DicomDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a study from Orthanc and mark as deleted in database
    
    - **study_uid**: StudyInstanceUID
    - **reason**: Reason for deletion (required)
    """
    # Find study in database
    result = await db.execute(
        select(DicomUploadLog).where(
            DicomUploadLog.study_instance_uid == study_uid
        )
    )
    upload_log = result.scalar_one_or_none()
    
    if not upload_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # Delete from Orthanc
    deleted = await orthanc_service.delete_study(upload_log.orthanc_study_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete study from Orthanc"
        )
    
    # Mark as deleted in database
    upload_log.is_deleted = True
    upload_log.upload_status = "deleted"
    upload_log.deleted_date = datetime.utcnow()
    upload_log.deletion_reason = delete_request.reason
    
    db.add(upload_log)
    await db.commit()
    
    logger.info(f"Study {study_uid} deleted by user {current_user.id}")
    
    return {
        "success": True,
        "message": "Study deleted successfully",
        "study_uid": study_uid
    }


@router.get("/studies/{study_uid}/thumbnail")
async def get_study_thumbnail(
    study_uid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get thumbnail image for a study
    
    Returns PNG image
    """
    # Find study
    result = await db.execute(
        select(DicomUploadLog).where(
            DicomUploadLog.study_instance_uid == study_uid
        )
    )
    upload_log = result.scalar_one_or_none()
    
    if not upload_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # Get thumbnail from Orthanc
    thumbnail_bytes = await orthanc_service.get_thumbnail(upload_log.orthanc_study_id)
    
    if not thumbnail_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thumbnail not available"
        )
    
    return Response(
        content=thumbnail_bytes,
        media_type="image/png"
    )


@router.get("/health", response_model=DicomHealthResponse)
async def health_check(
    current_user: User = Depends(get_current_user)
):
    """
    Check Orthanc PACS server health
    """
    health = await orthanc_service.health_check()
    
    if health.get("status") == "healthy":
        system_info = health.get("orthanc_system", {})
        return DicomHealthResponse(
            status="healthy",
            orthanc_version=system_info.get("Version"),
            api_version=system_info.get("ApiVersion"),
            database_version=system_info.get("DatabaseVersion"),
            message="Orthanc is running and accessible"
        )
    else:
        return DicomHealthResponse(
            status="unhealthy",
            message=f"Orthanc connection failed: {health.get('error')}"
        )


@router.get("/statistics", response_model=DicomStatisticsResponse)
async def get_statistics(
    current_user: User = Depends(get_current_user)
):
    """
    Get Orthanc system statistics
    """
    stats = await orthanc_service.get_system_statistics()
    
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics from Orthanc"
        )
    
    return DicomStatisticsResponse(
        total_disk_size=stats.get("TotalDiskSize", 0),
        total_disk_size_mb=round(stats.get("TotalDiskSize", 0) / (1024 * 1024), 2),
        count_patients=stats.get("CountPatients", 0),
        count_studies=stats.get("CountStudies", 0),
        count_series=stats.get("CountSeries", 0),
        count_instances=stats.get("CountInstances", 0),
    )


# ====================
# UPLOAD LOGS
# ====================

@router.get("/upload-logs", response_model=List[DicomUploadLogResponse])
async def list_upload_logs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all upload logs
    """
    result = await db.execute(
        select(DicomUploadLog)
        .order_by(DicomUploadLog.upload_date.desc())
        .offset(skip)
        .limit(limit)
    )
    logs = result.scalars().all()
    
    return [DicomUploadLogResponse.model_validate(log) for log in logs]


@router.get("/upload-logs/{log_id}", response_model=DicomUploadLogResponse)
async def get_upload_log(
    log_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific upload log entry
    """
    log = await db.get(DicomUploadLog, log_id)
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload log not found"
        )
    
    return DicomUploadLogResponse.model_validate(log)


@router.get("/upload-logs/patient/{patient_id}", response_model=List[DicomUploadLogResponse])
async def get_patient_upload_logs(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get upload logs for a patient
    """
    result = await db.execute(
        select(DicomUploadLog)
        .where(DicomUploadLog.patient_id == patient_id)
        .order_by(DicomUploadLog.upload_date.desc())
    )
    logs = result.scalars().all()
    
    return [DicomUploadLogResponse.model_validate(log) for log in logs]


# ====================
# VIEWER INTEGRATION
# ====================

# Import and include viewer router
from app.api.v1.dicom.viewer import router as viewer_router
router.include_router(viewer_router, prefix="/viewer", tags=["dicom-viewer"])
