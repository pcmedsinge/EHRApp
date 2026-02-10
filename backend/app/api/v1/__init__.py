from fastapi import APIRouter

# Create API router
api_router = APIRouter()

# Routers will be included here as they are created
# Example (Phase 1C):
# from app.api.v1.auth import router as auth_router
# api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
