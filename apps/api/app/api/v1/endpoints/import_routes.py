from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import (
    Service, ServiceEndpoint, AgentCardSnapshot, Skill,
    RegistryEvent, Visibility, ServiceStatus, ValidationRun, ValidationStatus,
)
from app.schemas.schemas import (
    AgentCardImport, AgentCardGenerate, AgentCardSnapshotResponse,
    ServiceResponse, ValidationRunResponse,
)
from app.services.validation_engine import (
    AgentCardValidator, AgentCardFetcher, normalize_agent_card, compute_checksum,
)
from app.services.agent_card_generator import generate_agent_card, compute_card_checksum

router = APIRouter(prefix="/services", tags=["agent-card"])


@router.post("/import", response_model=ServiceResponse, status_code=201)
async def import_agent_card(
    body: AgentCardImport,
    db: AsyncSession = Depends(get_db),
):
    """
    Import a service from an existing Agent Card URL.
    Fetches the card, validates it, and creates the service record.
    """
    fetcher = AgentCardFetcher()
    card_data, error, response_time = await fetcher.fetch(body.agent_card_url)

    if error or not card_data:
        raise HTTPException(422, f"Failed to fetch Agent Card: {error}")

    name = card_data.get("name", "Unnamed Service")
    slug = name.lower().replace(" ", "-").replace(".", "-")[:100]

    existing = await db.execute(select(Service).where(Service.slug == slug))
    if existing.scalar_one_or_none():
        import hashlib, time
        slug = f"{slug}-{hashlib.md5(str(time.time()).encode()).hexdigest()[:6]}"

    provider = card_data.get("provider", {})
    svc = Service(
        name=name,
        slug=slug,
        description=card_data.get("description", ""),
        provider_name=provider.get("organization") if isinstance(provider, dict) else None,
        provider_url=provider.get("url") if isinstance(provider, dict) else None,
        visibility=Visibility.DRAFT,
        version=card_data.get("version", "1.0.0"),
        documentation_url=card_data.get("documentationUrl"),
        icon_url=card_data.get("iconUrl"),
        organization_id=UUID("00000000-0000-0000-0000-000000000001"),
    )
    db.add(svc)
    await db.flush()

    # Create endpoint
    url = card_data.get("url", "")
    endpoint = ServiceEndpoint(
        service_id=svc.id,
        agent_card_url=body.agent_card_url,
        base_url=url,
        is_preferred=True,
    )
    db.add(endpoint)
    await db.flush()

    # Create snapshot
    normalized = normalize_agent_card(card_data)
    checksum = compute_checksum(card_data)
    snapshot = AgentCardSnapshot(
        service_id=svc.id,
        raw_json=card_data,
        normalized_json=normalized,
        checksum=checksum,
    )
    db.add(snapshot)
    await db.flush()

    svc.current_snapshot_id = snapshot.id

    # Import skills
    for skill_data in card_data.get("skills", []):
        if isinstance(skill_data, dict):
            skill = Skill(
                service_id=svc.id,
                external_skill_id=skill_data.get("id"),
                name=skill_data.get("name", "Unknown"),
                description=skill_data.get("description", ""),
                tags=skill_data.get("tags", []),
                input_modes=skill_data.get("inputModes", []),
                output_modes=skill_data.get("outputModes", []),
                examples=skill_data.get("examples", []),
            )
            db.add(skill)

    # Run initial validation
    validator = AgentCardValidator()
    validation_result = await validator.validate_card(card_data, fetch_endpoint=True)

    validation_run = ValidationRun(
        service_id=svc.id,
        status=ValidationStatus(validation_result.status),
        score=validation_result.score,
        checks=validation_result.checks,
        errors=validation_result.errors,
        warnings=validation_result.warnings,
        response_time_ms=validation_result.response_time_ms,
    )
    db.add(validation_run)

    db.add(RegistryEvent(
        service_id=svc.id,
        event_type="service.imported",
        metadata={"agent_card_url": body.agent_card_url, "checksum": checksum},
    ))

    await db.flush()
    return svc


@router.post("/{service_id}/agent-card/generate", response_model=AgentCardSnapshotResponse, status_code=201)
async def generate_agent_card_endpoint(
    service_id: UUID,
    body: AgentCardGenerate,
    db: AsyncSession = Depends(get_db),
):
    """Generate an Agent Card from builder form data and store it as a snapshot."""
    svc = await db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")

    card = generate_agent_card(body.model_dump())
    checksum = compute_card_checksum(card)
    normalized = normalize_agent_card(card)

    snapshot = AgentCardSnapshot(
        service_id=service_id,
        raw_json=card,
        normalized_json=normalized,
        checksum=checksum,
    )
    db.add(snapshot)
    await db.flush()

    return snapshot


@router.get("/{service_id}/agent-card", response_model=AgentCardSnapshotResponse)
async def get_latest_agent_card(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Fetch the latest stored Agent Card snapshot."""
    result = await db.execute(
        select(AgentCardSnapshot)
        .where(AgentCardSnapshot.service_id == service_id)
        .order_by(AgentCardSnapshot.created_at.desc())
        .limit(1)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(404, "No Agent Card snapshot found")
    return snapshot


@router.post("/{service_id}/validate", response_model=ValidationRunResponse, status_code=201)
async def validate_service(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Run validation on the latest Agent Card snapshot."""
    snapshot_result = await db.execute(
        select(AgentCardSnapshot)
        .where(AgentCardSnapshot.service_id == service_id)
        .order_by(AgentCardSnapshot.created_at.desc())
        .limit(1)
    )
    snapshot = snapshot_result.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(404, "No Agent Card snapshot to validate")

    validator = AgentCardValidator()
    result = await validator.validate_card(snapshot.raw_json, fetch_endpoint=True)

    run = ValidationRun(
        service_id=service_id,
        status=ValidationStatus(result.status),
        score=result.score,
        checks=result.checks,
        errors=result.errors,
        warnings=result.warnings,
        response_time_ms=result.response_time_ms,
    )
    db.add(run)

    db.add(RegistryEvent(
        service_id=service_id,
        event_type="service.validated",
        metadata={"status": result.status, "score": result.score},
    ))
    await db.flush()
    return run


@router.get("/{service_id}/validation-runs", response_model=list[ValidationRunResponse])
async def list_validation_runs(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ValidationRun)
        .where(ValidationRun.service_id == service_id)
        .order_by(ValidationRun.created_at.desc())
        .limit(20)
    )
    return result.scalars().all()
