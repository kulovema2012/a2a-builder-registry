from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import (
    Service, ServiceEndpoint, AgentCardSnapshot, Skill,
    SecurityScheme, ValidationRun, RegistryEvent,
    Visibility, ServiceStatus, ValidationStatus,
)
from app.schemas.schemas import (
    ServiceCreate, ServiceUpdate, ServiceResponse,
    EndpointCreate, EndpointResponse,
    SkillCreate, SkillResponse,
    AgentCardImport, AgentCardSnapshotResponse,
    ValidationRunResponse,
    ServiceListResponse,
)
from app.services.validation_engine import (
    AgentCardValidator, AgentCardFetcher, normalize_agent_card, compute_checksum,
)
from app.services.agent_card_generator import generate_agent_card, compute_card_checksum

router = APIRouter(prefix="/services", tags=["services"])


# --- Service CRUD ---

@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(
    body: ServiceCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Service).where(Service.slug == body.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Service slug '{body.slug}' already exists")

    svc = Service(
        name=body.name,
        slug=body.slug,
        description=body.description,
        provider_name=body.provider_name,
        provider_url=body.provider_url,
        visibility=Visibility(body.visibility),
        tags=body.tags,
        icon_url=body.icon_url,
        documentation_url=body.documentation_url,
        version=body.version,
        organization_id=UUID("00000000-0000-0000-0000-000000000001"),  # TODO: from auth
    )
    db.add(svc)
    await db.flush()

    event = RegistryEvent(
        service_id=svc.id,
        event_type="service.created",
        metadata={"name": svc.name, "slug": svc.slug},
    )
    db.add(event)
    await db.flush()

    return svc


@router.get("", response_model=ServiceListResponse)
async def list_services(
    q: str | None = None,
    visibility: str | None = None,
    status: str | None = None,
    tags: str | None = None,
    skill: str | None = None,
    provider: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Service)

    if q:
        query = query.where(
            or_(
                Service.name.ilike(f"%{q}%"),
                Service.description.ilike(f"%{q}%"),
                Service.slug.ilike(f"%{q}%"),
            )
        )
    if visibility:
        query = query.where(Service.visibility == Visibility(visibility))
    if status:
        query = query.where(Service.status == ServiceStatus(status))
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query = query.where(Service.tags.overlap(tag_list))
    if provider:
        query = query.where(Service.provider_name.ilike(f"%{provider}%"))
    if skill:
        skill_subq = select(Skill.service_id).where(Skill.name.ilike(f"%{skill}%"))
        query = query.where(Service.id.in_(skill_subq))

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Service.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    services = result.scalars().all()

    return ServiceListResponse(
        items=services,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: UUID, db: AsyncSession = Depends(get_db)):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")
    return svc


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: UUID,
    body: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "visibility" and value:
            setattr(svc, field, Visibility(value))
        else:
            setattr(svc, field, value)

    db.add(RegistryEvent(
        service_id=service_id,
        event_type="service.updated",
        metadata={"updated_fields": list(update_data.keys())},
    ))
    await db.flush()
    return svc


@router.delete("/{service_id}", status_code=204)
async def delete_service(service_id: UUID, db: AsyncSession = Depends(get_db)):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    db.add(RegistryEvent(
        service_id=service_id,
        event_type="service.deleted",
        metadata={"name": svc.name},
    ))
    await db.delete(svc)


# --- Endpoints ---

@router.post("/{service_id}/endpoints", response_model=EndpointResponse, status_code=201)
async def add_endpoint(
    service_id: UUID,
    body: EndpointCreate,
    db: AsyncSession = Depends(get_db),
):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    from app.models.models import ProtocolBinding
    endpoint = ServiceEndpoint(
        service_id=service_id,
        agent_card_url=body.agent_card_url,
        base_url=body.base_url,
        protocol_binding=ProtocolBinding(body.protocol_binding),
        protocol_version=body.protocol_version,
        tenant=body.tenant,
        is_preferred=body.is_preferred,
    )
    db.add(endpoint)
    await db.flush()
    return endpoint


@router.get("/{service_id}/endpoints", response_model=list[EndpointResponse])
async def list_endpoints(service_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ServiceEndpoint).where(ServiceEndpoint.service_id == service_id)
    )
    return result.scalars().all()


# --- Skills ---

@router.post("/{service_id}/skills", response_model=SkillResponse, status_code=201)
async def add_skill(
    service_id: UUID,
    body: SkillCreate,
    db: AsyncSession = Depends(get_db),
):
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    skill = Skill(
        service_id=service_id,
        external_skill_id=body.external_skill_id,
        name=body.name,
        description=body.description,
        tags=body.tags,
        input_modes=body.input_modes,
        output_modes=body.output_modes,
        examples=body.examples,
        security_requirements=body.security_requirements,
    )
    db.add(skill)
    await db.flush()
    return skill


@router.get("/{service_id}/skills", response_model=list[SkillResponse])
async def list_skills(service_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Skill).where(Skill.service_id == service_id)
    )
    return result.scalars().all()
