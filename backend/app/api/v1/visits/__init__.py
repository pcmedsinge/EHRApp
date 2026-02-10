"""
Visits API Package
==================

Purpose:
    Visit management API endpoints.
    Provides CRUD, status management, and query operations.

Module: app/api/v1/visits/__init__.py
Phase: 2B (Backend - Visit API)

References:
    - Phase 2B Spec: docs/phases/phase2/Phase2B_Backend_VisitAPI.md
    - Visit Model: app/models/visit.py

Endpoints:
    - POST /visits - Create visit
    - GET /visits - List visits (filtered)
    - GET /visits/{id} - Get visit
    - PUT /visits/{id} - Update visit
    - DELETE /visits/{id} - Cancel visit
    - PATCH /visits/{id}/status - Update status
    - POST /visits/{id}/start - Start consultation
    - POST /visits/{id}/complete - Complete consultation
    - GET /visits/patient/{id} - Patient history
    - GET /visits/doctor/{id} - Doctor's visits
    - GET /visits/today - Today's visits
    - GET /visits/queue - Current queue
    - GET /visits/stats - Statistics
"""

from app.api.v1.visits.router import router

__all__ = ["router"]
