"""
Settings API Package
====================

Purpose:
    System settings and feature flags API.
    Provides configuration access for frontend.

Module: app/api/v1/settings/__init__.py
Phase: 2B (Backend - Visit API)

References:
    - Phase 2B Spec: docs/phases/phase2/Phase2B_Backend_VisitAPI.md
    - SystemSetting Model: app/models/system_setting.py

Endpoints:
    - GET /settings/features - Get feature flags
    - GET /settings - List all settings (admin)
    - PUT /settings/{key} - Update setting (admin)
"""

from app.api.v1.settings.router import router

__all__ = ["router"]
