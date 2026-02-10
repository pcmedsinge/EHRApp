"""
Orthanc PACS Service
====================

Purpose:
    Service layer for interacting with Orthanc PACS server.
    Handles DICOM file upload, query, retrieval, and deletion.

Module: app/services/orthanc_service.py
Phase: 5A (Orthanc Backend)

Key Methods:
    - upload_dicom(): Upload DICOM file to Orthanc
    - upload_multiple_dicom(): Batch upload
    - get_study(): Get study by StudyInstanceUID
    - get_study_by_orthanc_id(): Get study by Orthanc internal ID
    - query_patient_studies(): Get all studies for a patient
    - query_by_accession_number(): Find study by accession number
    - delete_study(): Remove study from Orthanc
    - get_thumbnail(): Generate study thumbnail
    - health_check(): Verify Orthanc connectivity

Orthanc REST API Reference:
    - POST /instances: Upload DICOM file
    - GET /studies/{id}: Get study metadata
    - GET /patients/{id}/studies: Query patient studies
    - DELETE /studies/{id}: Delete study
    - GET /studies/{id}/preview: Get thumbnail
"""

import httpx
from typing import List, Dict, Optional, BinaryIO
from fastapi import HTTPException, status, UploadFile
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class OrthancService:
    """
    Service for Orthanc PACS interactions
    """
    
    def __init__(self):
        self.base_url = settings.ORTHANC_URL
        self.username = settings.ORTHANC_USERNAME
        self.password = settings.ORTHANC_PASSWORD
        self.auth = (self.username, self.password)
        self.timeout = 60.0  # 60 seconds timeout for uploads
    
    async def health_check(self) -> Dict:
        """
        Check Orthanc server health and version
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/system",
                    auth=self.auth,
                    timeout=5.0
                )
                response.raise_for_status()
                return {
                    "status": "healthy",
                    "orthanc_system": response.json()
                }
        except httpx.HTTPError as e:
            logger.error(f"Orthanc health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def upload_dicom(self, file_content: bytes) -> Dict:
        """
        Upload a single DICOM file to Orthanc
        
        Args:
            file_content: DICOM file binary content
        
        Returns:
            Dict with:
                - ID: Orthanc internal instance ID
                - ParentStudy: Orthanc study ID
                - Status: Upload status
        
        Raises:
            HTTPException: If upload fails
        """
        try:
            logger.info(f"Uploading DICOM to {self.base_url}/instances (size: {len(file_content)} bytes)")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/instances",
                    content=file_content,
                    auth=self.auth,
                    timeout=self.timeout,
                    headers={"Content-Type": "application/dicom"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"DICOM uploaded successfully: {result.get('ID')}")
                    return result
                else:
                    error_msg = f"Upload failed with status {response.status_code}: {response.text}"
                    logger.error(error_msg)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=error_msg
                    )
                    
        except httpx.HTTPError as e:
            logger.error(f"Orthanc upload error ({type(e).__name__}): {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload DICOM: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error uploading to Orthanc ({type(e).__name__}): {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(e)}"
            )
    
    async def upload_multiple_dicom(self, files: List[bytes]) -> Dict:
        """
        Upload multiple DICOM files
        
        Args:
            files: List of DICOM file binary contents
        
        Returns:
            Dict with upload statistics:
                - successful: Count of successful uploads
                - failed: Count of failed uploads
                - studies: List of unique study IDs
        """
        successful = 0
        failed = 0
        study_ids = set()
        errors = []
        
        for idx, file_content in enumerate(files):
            try:
                result = await self.upload_dicom(file_content)
                successful += 1
                if "ParentStudy" in result:
                    study_ids.add(result["ParentStudy"])
            except Exception as e:
                failed += 1
                errors.append(f"File {idx+1}: {str(e)}")
                logger.error(f"Failed to upload file {idx+1}: {str(e)}")
        
        return {
            "total_files": len(files),
            "successful": successful,
            "failed": failed,
            "studies": list(study_ids),
            "errors": errors
        }
    
    async def get_study(self, study_instance_uid: str) -> Optional[Dict]:
        """
        Get study by DICOM StudyInstanceUID
        
        Args:
            study_instance_uid: DICOM StudyInstanceUID
        
        Returns:
            Study metadata dict or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                # First, find the study using DICOMweb QIDO
                qido_url = f"{self.base_url}/dicom-web/studies"
                response = await client.get(
                    qido_url,
                    params={"StudyInstanceUID": study_instance_uid},
                    auth=self.auth,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    studies = response.json()
                    if studies and len(studies) > 0:
                        return studies[0]
                    
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"Error querying study {study_instance_uid}: {str(e)}")
            return None
    
    async def get_study_by_orthanc_id(self, orthanc_study_id: str) -> Optional[Dict]:
        """
        Get study by Orthanc internal ID
        
        Args:
            orthanc_study_id: Orthanc's internal study ID
        
        Returns:
            Study metadata dict or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/studies/{orthanc_study_id}",
                    auth=self.auth,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                    
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"Error getting study {orthanc_study_id}: {str(e)}")
            return None
    
    async def query_patient_studies(self, patient_id: str) -> List[Dict]:
        """
        Query all studies for a patient
        
        Args:
            patient_id: Patient ID (usually MRN) from DICOM PatientID
        
        Returns:
            List of study metadata dicts
        """
        try:
            async with httpx.AsyncClient() as client:
                # Use DICOMweb QIDO to search by PatientID
                qido_url = f"{self.base_url}/dicom-web/studies"
                response = await client.get(
                    qido_url,
                    params={"PatientID": patient_id},
                    auth=self.auth,
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    return response.json()
                    
                return []
                
        except httpx.HTTPError as e:
            logger.error(f"Error querying patient studies for {patient_id}: {str(e)}")
            return []
    
    async def query_by_accession_number(self, accession_number: str) -> Optional[Dict]:
        """
        Find study by accession number
        
        Args:
            accession_number: DICOM AccessionNumber
        
        Returns:
            Study metadata dict or None if not found
        """
        try:
            async with httpx.AsyncClient() as client:
                # Use DICOMweb QIDO to search by AccessionNumber
                qido_url = f"{self.base_url}/dicom-web/studies"
                response = await client.get(
                    qido_url,
                    params={"AccessionNumber": accession_number},
                    auth=self.auth,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    studies = response.json()
                    if studies and len(studies) > 0:
                        return studies[0]
                    
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"Error querying accession {accession_number}: {str(e)}")
            return None
    
    async def delete_study(self, study_uid_or_orthanc_id: str) -> bool:
        """
        Delete a study from Orthanc
        
        Args:
            study_uid_or_orthanc_id: StudyInstanceUID or Orthanc internal ID
        
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            # Try to get the Orthanc ID first if StudyInstanceUID is provided
            study = await self.get_study(study_uid_or_orthanc_id)
            if study:
                # Extract Orthanc ID from study metadata
                # The Orthanc ID is in the study's URL or ID field
                orthanc_id = study.get("ID")
                if not orthanc_id:
                    # Fallback: use the provided ID as Orthanc ID
                    orthanc_id = study_uid_or_orthanc_id
            else:
                # Assume the provided ID is the Orthanc ID
                orthanc_id = study_uid_or_orthanc_id
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/studies/{orthanc_id}",
                    auth=self.auth,
                    timeout=30.0
                )
                
                if response.status_code in [200, 204]:
                    logger.info(f"Study {orthanc_id} deleted successfully")
                    return True
                else:
                    logger.error(f"Failed to delete study {orthanc_id}: status {response.status_code}")
                    return False
                    
        except httpx.HTTPError as e:
            logger.error(f"Error deleting study: {str(e)}")
            return False
    
    async def get_thumbnail(self, orthanc_study_id: str) -> Optional[bytes]:
        """
        Get thumbnail image for a study
        
        Args:
            orthanc_study_id: Orthanc internal study ID
        
        Returns:
            PNG image bytes or None if not available
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/studies/{orthanc_study_id}/preview",
                    auth=self.auth,
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    return response.content
                    
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"Error getting thumbnail for {orthanc_study_id}: {str(e)}")
            return None
    
    async def get_study_statistics(self, orthanc_study_id: str) -> Optional[Dict]:
        """
        Get study statistics (series count, instance count, size)
        
        Args:
            orthanc_study_id: Orthanc internal study ID
        
        Returns:
            Dict with statistics or None if not available
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/studies/{orthanc_study_id}/statistics",
                    auth=self.auth,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                    
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"Error getting statistics for {orthanc_study_id}: {str(e)}")
            return None
    
    async def get_system_statistics(self) -> Dict:
        """
        Get Orthanc system statistics
        
        Returns:
            Dict with:
                - TotalDiskSize: Total storage used
                - TotalDiskSizeMB: Storage in MB
                - CountPatients: Number of patients
                - CountStudies: Number of studies
                - CountSeries: Number of series
                - CountInstances: Number of instances (images)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/statistics",
                    auth=self.auth,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                    
                return {}
                
        except httpx.HTTPError as e:
            logger.error(f"Error getting system statistics: {str(e)}")
            return {}


# Global singleton instance
orthanc_service = OrthancService()
