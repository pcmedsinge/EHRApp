"""
EHR Application - Main Entry Point
=====================================

Purpose:
    FastAPI application factory and configuration.
    Sets up middleware, routers, and lifespan events.

Module: app/main.py
Phase: 1B (Backend Core)

References:
    - Architecture: docs/diagrams/architecture.md
    - Backend Structure: docs/phases/phase1/diagrams/infrastructure.md
    - API Overview: docs/diagrams/api-overview.md

Endpoints Mounted:
    - /api/v1/auth/* - Authentication (Phase 1C)
    - /api/v1/users/* - User management (Phase 1C)
    - /api/v1/patients/* - Patient management (Phase 1D)
    - /api/v1/visits/* - Visit management (Phase 2B) [Planned]

Usage:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📊 Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
    print(f"🔒 Debug mode: {settings.DEBUG}")
    
    # Initialize database (optional - Alembic will handle this)
    # await init_db()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Electronic Health Record System API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        },
        status_code=200,
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


# Include API router
app.include_router(api_router, prefix="/api/v1")
