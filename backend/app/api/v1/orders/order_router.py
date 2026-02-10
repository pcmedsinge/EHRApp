"""
Order API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from uuid import UUID
from datetime import date

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.models.user import User
from app.schemas.order import (
    ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate,
    OrderUpdate, OrderStatusUpdate, OrderReportAdd,
    OrderResponse, OrderType, OrderStatus,
    ModalityResponse, LabTestResponse, ProcedureTypeResponse, BodyPartResponse
)
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


# Order CRUD
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: Union[ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new order (Imaging/Lab/Procedure)
    
    Generates:
    - order_number: ORD-YYYY-NNNNN
    - accession_number: ACC-YYYY-NNNNN
    """
    print(f"🔍 Received order_data: {order_data}")
    print(f"🔍 patient_id: {order_data.patient_id}, visit_id: {order_data.visit_id}")
    return await order_service.create_order(
        db, order_data, order_data.patient_id, order_data.visit_id, current_user.id
    )


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    order_type: Optional[OrderType] = None,
    status: Optional[OrderStatus] = None,
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List orders with filters
    """
    return await order_service.list_orders(
        db, skip, limit, order_type, status, patient_id, visit_id, date_from, date_to
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get order by ID"""
    return await order_service.get_order(db, order_id)


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order details"""
    return await order_service.update_order(db, order_id, order_data)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete order (soft delete)"""
    order = await order_service.get_order(db, order_id)
    order.is_deleted = True
    await db.commit()
    return None


# Status Management
@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order status"""
    return await order_service.update_order_status(db, order_id, status_data, current_user.id)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    reason: str = Query(..., min_length=10),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel order with reason"""
    return await order_service.cancel_order(db, order_id, reason, current_user.id)


@router.post("/{order_id}/report", response_model=OrderResponse)
async def add_report(
    order_id: UUID,
    report_data: OrderReportAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add report to order"""
    return await order_service.add_report(db, order_id, report_data, current_user.id)


# Search
@router.get("/search/accession/{accession_number}", response_model=OrderResponse)
async def search_by_accession(
    accession_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search order by accession number"""
    return await order_service.get_order_by_accession(db, accession_number)


@router.get("/search/number/{order_number}", response_model=OrderResponse)
async def search_by_order_number(
    order_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search order by order number"""
    return await order_service.get_order_by_number(db, order_number)


# Patient/Visit Specific
@router.get("/patient/{patient_id}", response_model=List[OrderResponse])
async def get_patient_orders(
    patient_id: UUID,
    order_type: Optional[OrderType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient's order history"""
    return await order_service.get_patient_order_history(db, patient_id, order_type)


@router.get("/visit/{visit_id}", response_model=List[OrderResponse])
async def get_visit_orders(
    visit_id: UUID,
    order_type: Optional[OrderType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders for a visit"""
    return await order_service.get_visit_orders(db, visit_id, order_type)


# Reference Data
@router.get("/modalities/list", response_model=List[ModalityResponse])
async def get_modalities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get imaging modalities"""
    return await order_service.get_imaging_modalities(db)


@router.get("/lab-tests/list", response_model=List[LabTestResponse])
async def get_lab_tests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lab tests"""
    return await order_service.get_lab_tests(db)


@router.get("/procedures/list", response_model=List[ProcedureTypeResponse])
async def get_procedures(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get procedure types"""
    return await order_service.get_procedure_types(db)


@router.get("/body-parts/list", response_model=List[BodyPartResponse])
async def get_body_parts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get body parts"""
    return await order_service.get_body_parts(db)
