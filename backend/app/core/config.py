"""
Application Configuration
========================

Purpose:
    Central configuration management using Pydantic Settings.
    Loads values from environment variables and .env file.

Module: app/core/config.py
Phase: 1B (Backend Core)

References:
    - Architecture: docs/diagrams/architecture.md
    - Backend Structure: docs/phases/phase1/diagrams/infrastructure.md

Environment Variables:
    Required:
        - DATABASE_URL: PostgreSQL connection string
        - SECRET_KEY: JWT signing key
    Optional:
        - DEBUG: Enable debug mode (default: True)
        - CORS_ORIGINS: Comma-separated allowed origins
        - ACCESS_TOKEN_EXPIRE_MINUTES: JWT expiry (default: 60)

Usage:
    from app.core.config import settings
    print(settings.APP_NAME)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """
    Application settings loaded from environment.
    
    Uses Pydantic BaseSettings for validation and type coercion.
    Values are loaded from .env file or environment variables.
    """
    
    # Application
    APP_NAME: str = "EHR System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Orthanc PACS Configuration (Phase 5)
    ORTHANC_URL: str = "http://localhost:8042"
    ORTHANC_USERNAME: str = "orthanc"
    ORTHANC_PASSWORD: str = "orthanc"
    ORTHANC_DICOMWEB_URL: str = "http://localhost:8042/dicom-web"
    
    # OHIF Viewer Configuration (Phase 5)
    OHIF_VIEWER_URL: str = "http://localhost:3001"
    
    # DICOM Upload Limits (Phase 5)
    MAX_DICOM_FILE_SIZE_MB: int = 100
    MAX_DICOM_FILES_PER_UPLOAD: int = 500
    MAX_UPLOAD_SIZE_MB: int = 2048
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Global settings instance
settings = Settings()
