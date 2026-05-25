from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import (
    Service, ApprovalRequest, RegistryEvent,
    ServiceStatus, ApprovalStatus,
)
from app.schemas.schemas import ApprovalAction, ApprovalRequestResponse, ServiceResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/services/{service_id}/approve", response_model=ApprovalRequestResponse)
async def approve_service(
    service_id: UUID,
    body: ApprovalAction,
    db: AsyncSession = Depends(get_db),
):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    result = await db.execute(
        select(ApprovalRequest)
        .where(ApprovalRequest.service_id == service_id, ApprovalRequest.status == ApprovalStatus.PENDING)
        .order_by(ApprovalRequest.created_at.desc())
        .limit(1)
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(404, "No pending approval request found")

    if body.approved:
        approval.status = ApprovalStatus.APPROVED
        svc.visibility = "public"
        svc.status = ServiceStatus.ACTIVE
        event_type = "publication.approved"
    else:
        approval.status = ApprovalStatus.REJECTED
        svc.status = ServiceStatus.ACTIVE
        event_type = "publication.rejected"

    approval.notes = body.notes
    approval.reviewed_by = UUID("00000000-0000-0000-0000-000000000001")  # TODO: from auth
    from datetime import datetime
    approval.reviewed_at = datetime.utcnow()

    db.add(RegistryEvent(
        service_id=service_id,
        event_type=event_type,
        metadata={"approved": body.approved, "notes": body.notes},
    ))
    await db.flush()
    return approval


@router.post("/services/{service_id}/suspend", response_model=ServiceResponse)
async def suspend_service(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    svc.status = ServiceStatus.SUSPENDED
    db.add(RegistryEvent(
        service_id=service_id,
        event_type="service.suspended",
    ))
    await db.flush()
    return svc
