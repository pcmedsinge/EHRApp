"""
Order Service
Business logic for order management
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from typing import List, Optional, Union
from uuid import UUID
from datetime import datetime, date
from app.models.order import Order
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.order import (
    ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate,
    OrderUpdate, OrderStatusUpdate, OrderReportAdd,
    OrderType, OrderStatus
)
from fastapi import HTTPException, status


# Number Generation
async def generate_order_number(db: AsyncSession) -> str:
    """
    Generate unique order number: ORD-YYYY-NNNNN
    """
    current_year = datetime.now().year
    prefix = f"ORD-{current_year}-"
    
    # Get last order number for current year
    result = await db.execute(
        select(Order.order_number)
        .where(Order.order_number.like(f"{prefix}%"))
        .order_by(Order.order_number.desc())
        .limit(1)
    )
    last_number = result.scalar_one_or_none()
    
    if last_number:
        sequence = int(last_number.split('-')[-1]) + 1
    else:
        sequence = 1
    
    return f"{prefix}{sequence:05d}"


async def generate_accession_number(db: AsyncSession) -> str:
    """
    Generate unique accession number: ACC-YYYY-NNNNN
    """
    current_year = datetime.now().year
    prefix = f"ACC-{current_year}-"
    
    # Get last accession number for current year
    result = await db.execute(
        select(Order.accession_number)
        .where(Order.accession_number.like(f"{prefix}%"))
        .order_by(Order.accession_number.desc())
        .limit(1)
    )
    last_number = result.scalar_one_or_none()
    
    if last_number:
        sequence = int(last_number.split('-')[-1]) + 1
    else:
        sequence = 1
    
    return f"{prefix}{sequence:05d}"


# CRUD Operations
async def create_order(
    db: AsyncSession,
    order_data: Union[ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate],
    patient_id: UUID,
    visit_id: Optional[UUID],
    user_id: UUID
) -> Order:
    """
    Create new order
    """
    # Validate patient exists
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate visit exists if provided
    if visit_id:
        visit = await db.get(Visit, visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Visit not found"
            )
    
    # Generate numbers
    order_number = await generate_order_number(db)
    accession_number = await generate_accession_number(db)
    
    # Build order_details based on type - exclude base schema fields
    order_dict = order_data.dict(exclude={
        'order_type', 'priority', 'clinical_indication', 'special_instructions',
        'patient_id', 'visit_id', 'scheduled_date'
    })
    
    # Convert UUID objects to strings for JSON serialization
    order_details = {}
    for key, value in order_dict.items():
        if isinstance(value, UUID):
            order_details[key] = str(value)
        elif isinstance(value, list):
            order_details[key] = [str(v) if isinstance(v, UUID) else v for v in value]
        else:
            order_details[key] = value
    
    # Create order
    order = Order(
        order_number=order_number,
        accession_number=accession_number,
        order_type=order_data.order_type.value,
        status=OrderStatus.ORDERED.value,
        priority=order_data.priority.value,
        clinical_indication=order_data.clinical_indication,
        special_instructions=order_data.special_instructions,
        order_details=order_details,
        patient_id=patient_id,
        visit_id=visit_id,
        ordered_by=user_id,
        ordered_date=datetime.utcnow(),
        scheduled_date=order_data.scheduled_date
    )
    
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    # Reload with relationships
    result = await db.execute(
        select(Order)
        .options(
            joinedload(Order.patient),
            joinedload(Order.visit),
            joinedload(Order.ordered_by_user)
        )
        .where(Order.id == order.id)
    )
    order = result.scalar_one()
    
    return order


async def get_order(db: AsyncSession, order_id: UUID) -> Order:
    """Get order by ID with relationships"""
    result = await db.execute(
        select(Order)
        .options(
            joinedload(Order.patient),
            joinedload(Order.visit),
            joinedload(Order.ordered_by_user),
            joinedload(Order.performing_user),
            joinedload(Order.reporting_user)
        )
        .where(and_(Order.id == order_id, Order.is_deleted == False))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order


async def get_order_by_accession(db: AsyncSession, accession_number: str) -> Order:
    """Search by accession number"""
    result = await db.execute(
        select(Order)
        .options(
            joinedload(Order.patient),
            joinedload(Order.visit),
            joinedload(Order.ordered_by_user)
        )
        .where(and_(
            Order.accession_number == accession_number,
            Order.is_deleted == False
        ))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found with this accession number"
        )
    return order


async def get_order_by_number(db: AsyncSession, order_number: str) -> Order:
    """Search by order number"""
    result = await db.execute(
        select(Order)
        .options(
            joinedload(Order.patient),
            joinedload(Order.visit),
            joinedload(Order.ordered_by_user)
        )
        .where(and_(
            Order.order_number == order_number,
            Order.is_deleted == False
        ))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found with this order number"
        )
    return order


async def list_orders(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    order_type: Optional[OrderType] = None,
    status: Optional[OrderStatus] = None,
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> List[Order]:
    """List orders with filters"""
    query = select(Order).options(
        joinedload(Order.patient),
        joinedload(Order.visit),
        joinedload(Order.ordered_by_user)
    ).where(Order.is_deleted == False)
    
    # Apply filters
    if order_type:
        query = query.where(Order.order_type == order_type.value)
    if status:
        query = query.where(Order.status == status.value)
    if patient_id:
        query = query.where(Order.patient_id == patient_id)
    if visit_id:
        query = query.where(Order.visit_id == visit_id)
    if date_from:
        query = query.where(Order.ordered_date >= date_from)
    if date_to:
        query = query.where(Order.ordered_date <= date_to)
    
    query = query.order_by(Order.ordered_date.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


async def update_order(
    db: AsyncSession,
    order_id: UUID,
    order_data: OrderUpdate
) -> Order:
    """Update order details"""
    order = await get_order(db, order_id)
    
    update_data = order_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    await db.commit()
    await db.refresh(order)
    return order


async def update_order_status(
    db: AsyncSession,
    order_id: UUID,
    status_data: OrderStatusUpdate,
    user_id: UUID
) -> Order:
    """Update order status"""
    order = await get_order(db, order_id)
    
    new_status = status_data.status
    
    # Update status
    order.status = new_status.value
    if status_data.notes:
        order.notes = f"{order.notes or ''}\n{status_data.notes}".strip()
    
    # Update date fields based on status
    now = datetime.utcnow()
    if new_status == OrderStatus.SCHEDULED:
        order.scheduled_date = order.scheduled_date or now
    elif new_status == OrderStatus.IN_PROGRESS:
        order.performing_user_id = user_id
    elif new_status == OrderStatus.COMPLETED:
        order.performed_date = now
    elif new_status == OrderStatus.REPORTED:
        order.reported_date = now
        order.reporting_user_id = user_id
    elif new_status == OrderStatus.CANCELLED:
        order.cancelled_date = now
    
    await db.commit()
    await db.refresh(order)
    return order


async def cancel_order(
    db: AsyncSession,
    order_id: UUID,
    reason: str,
    user_id: UUID
) -> Order:
    """Cancel order with reason"""
    order = await get_order(db, order_id)
    
    order.status = OrderStatus.CANCELLED.value
    order.cancelled_date = datetime.utcnow()
    order.cancellation_reason = reason
    
    await db.commit()
    await db.refresh(order)
    return order


async def add_report(
    db: AsyncSession,
    order_id: UUID,
    report_data: OrderReportAdd,
    user_id: UUID
) -> Order:
    """Add report to order"""
    order = await get_order(db, order_id)
    
    order.report_text = report_data.report_text
    order.findings = report_data.findings
    order.impression = report_data.impression
    order.result_status = report_data.result_status
    order.reporting_user_id = user_id
    order.reported_date = datetime.utcnow()
    order.status = OrderStatus.REPORTED.value
    
    await db.commit()
    await db.refresh(order)
    return order


async def get_patient_order_history(
    db: AsyncSession,
    patient_id: UUID,
    order_type: Optional[OrderType] = None
) -> List[Order]:
    """Get patient's order history"""
    query = select(Order).options(
        joinedload(Order.visit),
        joinedload(Order.ordered_by_user)
    ).where(and_(
        Order.patient_id == patient_id,
        Order.is_deleted == False
    ))
    
    if order_type:
        query = query.where(Order.order_type == order_type.value)
    
    query = query.order_by(Order.ordered_date.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


async def get_visit_orders(
    db: AsyncSession,
    visit_id: UUID,
    order_type: Optional[OrderType] = None
) -> List[Order]:
    """Get all orders for a visit"""
    query = select(Order).options(
        joinedload(Order.patient),
        joinedload(Order.visit),
        joinedload(Order.ordered_by_user)
    ).where(and_(
        Order.visit_id == visit_id,
        Order.is_deleted == False
    ))
    
    if order_type:
        query = query.where(Order.order_type == order_type.value)
    
    query = query.order_by(Order.ordered_date.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


# Reference Data Services
async def get_imaging_modalities(db: AsyncSession) -> List:
    """Get all active imaging modalities"""
    from app.models.imaging_modality import ImagingModality
    result = await db.execute(
        select(ImagingModality)
        .where(ImagingModality.is_active == True)
        .order_by(ImagingModality.name)
    )
    return result.scalars().all()


async def get_lab_tests(db: AsyncSession) -> List:
    """Get all active lab tests"""
    from app.models.lab_test import LabTest
    result = await db.execute(
        select(LabTest)
        .where(LabTest.is_active == True)
        .order_by(LabTest.category, LabTest.name)
    )
    return result.scalars().all()


async def get_procedure_types(db: AsyncSession) -> List:
    """Get all active procedure types"""
    from app.models.procedure_type import ProcedureType
    result = await db.execute(
        select(ProcedureType)
        .where(ProcedureType.is_active == True)
        .order_by(ProcedureType.category, ProcedureType.name)
    )
    return result.scalars().all()


async def get_body_parts(db: AsyncSession) -> List:
    """Get all body parts"""
    from app.models.body_part import BodyPart
    result = await db.execute(
        select(BodyPart).order_by(BodyPart.name)
    )
    return result.scalars().all()
