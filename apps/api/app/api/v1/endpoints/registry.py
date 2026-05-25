from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import (
    Service, AgentCardSnapshot, ValidationRun,
    Visibility, ServiceStatus, ValidationStatus,
    ApprovalRequest, RegistryEvent, ApprovalStatus,
)
from app.schemas.schemas import (
    RegistryAgentEntry, ApprovalAction, ApprovalRequestResponse, ServiceResponse,
)
from datetime import datetime

router = APIRouter(prefix="/registry", tags=["registry"])


@router.get("/agents", response_model=list[RegistryAgentEntry])
async def discover_agents(
    q: str | None = None,
    skill: str | None = None,
    provider: str | None = None,
    protocol_binding: str | None = None,
    visibility: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Machine-readable registry discovery endpoint.
    Returns A2A-compatible agent listings for client-agent consumption.
    """
    query = select(Service)

    # Default to public/internal only for discovery
    if visibility:
        query = query.where(Service.visibility == Visibility(visibility))
    else:
        query = query.where(Service.visibility.in_([Visibility.PUBLIC, Visibility.INTERNAL]))

    query = query.where(Service.status == ServiceStatus.ACTIVE)

    if q:
        query = query.where(
            or_(
                Service.name.ilike(f"%{q}%"),
                Service.description.ilike(f"%{q}%"),
            )
        )
    if provider:
        query = query.where(Service.provider_name.ilike(f"%{provider}%"))

    query = query.order_by(Service.name.asc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    services = result.scalars().all()

    entries = []
    for svc in services:
        # Get latest snapshot
        snap_result = await db.execute(
            select(AgentCardSnapshot)
            .where(AgentCardSnapshot.service_id == svc.id)
            .order_by(AgentCardSnapshot.created_at.desc())
            .limit(1)
        )
        snapshot = snap_result.scalar_one_or_none()

        # Get latest validation status
        val_result = await db.execute(
            select(ValidationRun)
            .where(ValidationRun.service_id == svc.id)
            .order_by(ValidationRun.created_at.desc())
            .limit(1)
        )
        validation = val_result.scalar_one_or_none()

        card_data = snapshot.normalized_json if snapshot else {}
        entries.append(RegistryAgentEntry(
            service_id=svc.id,
            slug=svc.slug,
            visibility=svc.visibility,
            validation_status=validation.status if validation else None,
            last_validated_at=validation.created_at if validation else None,
            agent_card=card_data if card_data else None,
        ))

    return entries


@router.post("/services/{service_id}/publish-request", response_model=ApprovalRequestResponse, status_code=201)
async def request_publication(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    # Check that service has passed validation
    val_result = await db.execute(
        select(ValidationRun)
        .where(ValidationRun.service_id == service_id, ValidationRun.status == ValidationStatus.PASSED)
        .order_by(ValidationRun.created_at.desc())
        .limit(1)
    )
    if not val_result.scalar_one_or_none():
        raise HTTPException(422, "Service must pass validation before requesting publication")

    approval = ApprovalRequest(
        service_id=service_id,
        requested_by=UUID("00000000-0000-0000-0000-000000000001"),
    )
    db.add(approval)

    svc.status = ServiceStatus.PENDING_REVIEW
    db.add(RegistryEvent(
        service_id=service_id,
        event_type="publication.requested",
    ))
    await db.flush()
    return approval
