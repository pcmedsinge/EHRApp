"""
DICOM Tag Service
=================

Purpose:
    Service layer for DICOM file parsing, tag reading, and modification.
    Uses pydicom library for DICOM file operations.

Module: app/services/dicom_tag_service.py
Phase: 5A (Orthanc Backend)

Key Methods:
    - read_tags(): Parse DICOM file and extract key tags
    - read_all_tags(): Get all DICOM tags (for debugging)
    - modify_tags(): Update DICOM tags before upload
    - validate_dicom(): Verify file is valid DICOM
    - get_file_info(): Get file metadata (size, format)
    - extract_patient_info(): Extract patient demographics from DICOM

DICOM Tags Reference:
    Critical Tags:
        - (0010,0020): PatientID
        - (0010,0010): PatientName
        - (0020,000D): StudyInstanceUID
        - (0008,0050): AccessionNumber
        - (0020,0010): StudyID
        - (0008,0020): StudyDate
        - (0008,0030): StudyTime
        - (0008,0060): Modality
        - (0020,1206): NumberOfStudyRelatedSeries
        - (0020,1208): NumberOfStudyRelatedInstances
        - (0008,1030): StudyDescription
        - (0008,0090): ReferringPhysicianName
"""

import pydicom
from pydicom.dataset import Dataset, FileDataset
from pydicom.errors import InvalidDicomError
from typing import Dict, Optional, BinaryIO
from fastapi import HTTPException, status, UploadFile
from io import BytesIO
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class DicomTagService:
    """
    Service for DICOM file tag operations using pydicom
    """
    
    # Critical DICOM tags to extract
    CRITICAL_TAGS = {
        "PatientID": (0x0010, 0x0020),
        "PatientName": (0x0010, 0x0010),
        "StudyInstanceUID": (0x0020, 0x000D),
        "SeriesInstanceUID": (0x0020, 0x000E),
        "SOPInstanceUID": (0x0008, 0x0018),
        "AccessionNumber": (0x0008, 0x0050),
        "StudyID": (0x0020, 0x0010),
        "StudyDate": (0x0008, 0x0020),
        "StudyTime": (0x0008, 0x0030),
        "Modality": (0x0008, 0x0060),
        "StudyDescription": (0x0008, 0x1030),
        "ReferringPhysicianName": (0x0008, 0x0090),
        "PatientBirthDate": (0x0010, 0x0030),
        "PatientSex": (0x0010, 0x0040),
        "InstitutionName": (0x0008, 0x0080),
    }
    
    def validate_dicom(self, file_content: bytes) -> bool:
        """
        Validate if file is a valid DICOM file
        
        Args:
            file_content: Binary content of file
        
        Returns:
            True if valid DICOM, False otherwise
        """
        try:
            ds = pydicom.dcmread(BytesIO(file_content), stop_before_pixels=True)
            
            # Check for essential tags
            if not hasattr(ds, 'StudyInstanceUID'):
                logger.warning("DICOM file missing StudyInstanceUID")
                return False
                
            if not hasattr(ds, 'SOPInstanceUID'):
                logger.warning("DICOM file missing SOPInstanceUID")
                return False
            
            return True
            
        except InvalidDicomError as e:
            logger.error(f"Invalid DICOM file: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error validating DICOM: {str(e)}")
            return False
    
    def read_tags(self, file_content: bytes) -> Dict:
        """
        Read key DICOM tags from file
        
        Args:
            file_content: Binary content of DICOM file
        
        Returns:
            Dict with extracted tags
        
        Raises:
            HTTPException: If file is not valid DICOM
        """
        try:
            # Read DICOM file (without pixel data for faster processing)
            ds = pydicom.dcmread(BytesIO(file_content), stop_before_pixels=True)
            
            # Extract critical tags
            tags = {}
            for tag_name, tag_tuple in self.CRITICAL_TAGS.items():
                try:
                    value = ds.get(tag_tuple, None)
                    if value is not None:
                        # Convert to string, handle special types
                        if hasattr(value, 'value'):
                            tags[tag_name] = str(value.value)
                        else:
                            tags[tag_name] = str(value)
                    else:
                        tags[tag_name] = None
                except Exception as e:
                    logger.warning(f"Could not extract tag {tag_name}: {str(e)}")
                    tags[tag_name] = None
            
            # Add file metadata
            tags["TransferSyntaxUID"] = str(ds.file_meta.TransferSyntaxUID) if hasattr(ds, 'file_meta') else None
            tags["SOPClassUID"] = str(ds.SOPClassUID) if hasattr(ds, 'SOPClassUID') else None
            
            return tags
            
        except InvalidDicomError as e:
            logger.error(f"Invalid DICOM file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a valid DICOM file"
            )
        except Exception as e:
            logger.error(f"Error reading DICOM tags: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read DICOM tags: {str(e)}"
            )
    
    def read_all_tags(self, file_content: bytes) -> Dict:
        """
        Read all DICOM tags (for debugging/inspection)
        
        Args:
            file_content: Binary content of DICOM file
        
        Returns:
            Dict with all tags (tag name -> value)
        """
        try:
            ds = pydicom.dcmread(BytesIO(file_content), stop_before_pixels=True)
            
            all_tags = {}
            for elem in ds:
                try:
                    tag_name = elem.name
                    tag_value = str(elem.value) if elem.value is not None else None
                    all_tags[tag_name] = tag_value
                except Exception as e:
                    logger.warning(f"Could not process tag {elem.tag}: {str(e)}")
            
            return all_tags
            
        except Exception as e:
            logger.error(f"Error reading all DICOM tags: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read DICOM tags: {str(e)}"
            )
    
    def modify_tags(self, file_content: bytes, tag_updates: Dict) -> bytes:
        """
        Modify DICOM tags and return updated file
        
        Args:
            file_content: Original DICOM file binary content
            tag_updates: Dict of tag names and new values
                        Example: {"PatientName": "DOE^JOHN", "PatientID": "12345"}
        
        Returns:
            Modified DICOM file as bytes
        
        Raises:
            HTTPException: If modification fails
        """
        try:
            # Read the DICOM file (including pixel data)
            ds = pydicom.dcmread(BytesIO(file_content))
            
            # Apply tag updates
            for tag_name, new_value in tag_updates.items():
                if tag_name in self.CRITICAL_TAGS:
                    tag_tuple = self.CRITICAL_TAGS[tag_name]
                    try:
                        # Set the tag value
                        ds[tag_tuple].value = new_value
                        logger.info(f"Updated tag {tag_name} to {new_value}")
                    except Exception as e:
                        logger.error(f"Failed to update tag {tag_name}: {str(e)}")
                        # If tag doesn't exist, try to add it
                        try:
                            ds.add_new(tag_tuple, ds[tag_tuple].VR, new_value)
                        except Exception as e2:
                            logger.error(f"Failed to add tag {tag_name}: {str(e2)}")
                else:
                    logger.warning(f"Tag {tag_name} not in critical tags list, skipping")
            
            # Write modified DICOM to bytes
            output = BytesIO()
            ds.save_as(output, write_like_original=False)
            output.seek(0)
            modified_content = output.read()
            
            logger.info(f"Successfully modified DICOM file with {len(tag_updates)} tag updates")
            return modified_content
            
        except Exception as e:
            logger.error(f"Error modifying DICOM tags: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to modify DICOM tags: {str(e)}"
            )
    
    def get_file_info(self, file_content: bytes) -> Dict:
        """
        Get DICOM file metadata (size, modality, instances, etc.)
        
        Args:
            file_content: Binary content of DICOM file
        
        Returns:
            Dict with file information
        """
        try:
            ds = pydicom.dcmread(BytesIO(file_content), stop_before_pixels=True)
            
            info = {
                "file_size_bytes": len(file_content),
                "file_size_mb": round(len(file_content) / (1024 * 1024), 2),
                "modality": str(ds.Modality) if hasattr(ds, 'Modality') else None,
                "study_uid": str(ds.StudyInstanceUID) if hasattr(ds, 'StudyInstanceUID') else None,
                "series_uid": str(ds.SeriesInstanceUID) if hasattr(ds, 'SeriesInstanceUID') else None,
                "sop_uid": str(ds.SOPInstanceUID) if hasattr(ds, 'SOPInstanceUID') else None,
                "patient_id": str(ds.PatientID) if hasattr(ds, 'PatientID') else None,
                "study_date": str(ds.StudyDate) if hasattr(ds, 'StudyDate') else None,
                "transfer_syntax": str(ds.file_meta.TransferSyntaxUID) if hasattr(ds, 'file_meta') else None,
                "sop_class": str(ds.SOPClassUID) if hasattr(ds, 'SOPClassUID') else None,
            }
            
            # Try to get image dimensions if available
            if hasattr(ds, 'Rows') and hasattr(ds, 'Columns'):
                info["image_dimensions"] = f"{ds.Columns}x{ds.Rows}"
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting file info: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get file info: {str(e)}"
            )
    
    def extract_patient_info(self, file_content: bytes) -> Dict:
        """
        Extract patient demographic information from DICOM
        
        Args:
            file_content: Binary content of DICOM file
        
        Returns:
            Dict with patient demographics
        """
        try:
            ds = pydicom.dcmread(BytesIO(file_content), stop_before_pixels=True)
            
            patient_info = {
                "patient_id": str(ds.PatientID) if hasattr(ds, 'PatientID') else None,
                "patient_name": str(ds.PatientName) if hasattr(ds, 'PatientName') else None,
                "patient_birth_date": str(ds.PatientBirthDate) if hasattr(ds, 'PatientBirthDate') else None,
                "patient_sex": str(ds.PatientSex) if hasattr(ds, 'PatientSex') else None,
                "patient_age": str(ds.PatientAge) if hasattr(ds, 'PatientAge') else None,
            }
            
            # Parse patient name if available (format: LAST^FIRST^MIDDLE^PREFIX^SUFFIX)
            if patient_info["patient_name"]:
                try:
                    name_parts = patient_info["patient_name"].split('^')
                    patient_info["patient_name_parsed"] = {
                        "last_name": name_parts[0] if len(name_parts) > 0 else None,
                        "first_name": name_parts[1] if len(name_parts) > 1 else None,
                        "middle_name": name_parts[2] if len(name_parts) > 2 else None,
                    }
                except Exception:
                    pass
            
            return patient_info
            
        except Exception as e:
            logger.error(f"Error extracting patient info: {str(e)}")
            return {}


# Global singleton instance
dicom_tag_service = DicomTagService()
