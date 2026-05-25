from __future__ import annotations
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl


# --- Enums (mirror models) ---

class Visibility(BaseModel):
    draft: str = "draft"
    private: str = "private"
    internal: str = "internal"
    public: str = "public"


class ServiceStatus(BaseModel):
    active: str = "active"
    suspended: str = "suspended"
    delisted: str = "delisted"
    pending_review: str = "pending_review"


class ProtocolBinding(BaseModel):
    jsonrpc: str = "JSONRPC"
    grpc: str = "GRPC"
    http_json: str = "HTTP+JSON"


# --- Service ---

class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9][a-z0-9-]*[a-z0-9]$")
    description: str = Field(default="", max_length=5000)
    provider_name: str | None = None
    provider_url: str | None = None
    visibility: str = "draft"
    tags: list[str] = Field(default_factory=list)
    icon_url: str | None = None
    documentation_url: str | None = None
    version: str = "1.0.0"


class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    provider_name: str | None = None
    provider_url: str | None = None
    visibility: str | None = None
    tags: list[str] | None = None
    icon_url: str | None = None
    documentation_url: str | None = None
    version: str | None = None


class ServiceResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    slug: str
    description: str
    provider_name: str | None
    provider_url: str | None
    visibility: str
    status: str
    tags: list[str]
    icon_url: str | None
    documentation_url: str | None
    version: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Endpoint ---

class EndpointCreate(BaseModel):
    agent_card_url: str = Field(..., max_length=1024)
    base_url: str = Field(..., max_length=1024)
    protocol_binding: str = "JSONRPC"
    protocol_version: str = "0.2"
    tenant: str | None = None
    is_preferred: bool = True


class EndpointResponse(BaseModel):
    id: UUID
    service_id: UUID
    agent_card_url: str
    base_url: str
    protocol_binding: str
    protocol_version: str
    tenant: str | None
    is_preferred: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Skill ---

class SkillCreate(BaseModel):
    external_skill_id: str | None = None
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    tags: list[str] = Field(default_factory=list)
    input_modes: list[str] = Field(default_factory=list)
    output_modes: list[str] = Field(default_factory=list)
    examples: list[dict] = Field(default_factory=list)
    security_requirements: dict | None = None


class SkillResponse(BaseModel):
    id: UUID
    service_id: UUID
    external_skill_id: str | None
    name: str
    description: str
    tags: list[str]
    input_modes: list[str]
    output_modes: list[str]
    examples: list[dict]
    security_requirements: dict | None

    model_config = {"from_attributes": True}


# --- Agent Card Import ---

class AgentCardImport(BaseModel):
    agent_card_url: str = Field(..., max_length=1024)


class AgentCardGenerate(BaseModel):
    """Fields for generating an Agent Card from builder data."""
    name: str
    description: str = ""
    version: str = "1.0.0"
    provider_organization: str | None = None
    provider_url: str | None = None
    documentation_url: str | None = None
    icon_url: str | None = None
    endpoints: list[EndpointCreate] = Field(default_factory=list)
    default_input_modes: list[str] = Field(default_factory=lambda: ["text/plain"])
    default_output_modes: list[str] = Field(default_factory=lambda: ["text/plain"])
    capabilities: dict = Field(default_factory=lambda: {
        "streaming": False,
        "pushNotifications": False,
        "extendedAgentCard": False,
    })
    skills: list[SkillCreate] = Field(default_factory=list)
    security_schemes: dict | None = None
    security_requirements: list[dict] | None = None


# --- Agent Card Snapshot ---

class AgentCardSnapshotResponse(BaseModel):
    id: UUID
    service_id: UUID
    raw_json: dict
    normalized_json: dict | None
    schema_version: str | None
    checksum: str | None
    fetched_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Validation ---

class ValidationCheckResult(BaseModel):
    check: str
    status: str  # passed, failed, warning, skipped
    message: str
    field: str | None = None
    details: dict | None = None


class ValidationRunResponse(BaseModel):
    id: UUID
    service_id: UUID
    status: str
    score: int
    checks: list[dict]
    errors: list[dict]
    warnings: list[dict]
    response_time_ms: int | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Approval ---

class ApprovalRequestResponse(BaseModel):
    id: UUID
    service_id: UUID
    requested_by: UUID
    reviewed_by: UUID | None
    status: str
    notes: str | None
    created_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class ApprovalAction(BaseModel):
    approved: bool
    notes: str | None = None


# --- Test Console ---

class TestConsoleRequest(BaseModel):
    service_id: UUID
    endpoint_id: UUID | None = None
    method: str = "message/send"
    payload: dict = Field(default_factory=dict)
    auth_credentials: dict | None = None


class TestConsoleResponse(BaseModel):
    success: bool
    status_code: int | None = None
    response_body: dict | None = None
    response_time_ms: int | None = None
    error: str | None = None


# --- Search / List ---

class ServiceListParams(BaseModel):
    q: str | None = None
    visibility: str | None = None
    status: str | None = None
    tags: list[str] | None = None
    skill: str | None = None
    provider: str | None = None
    protocol_binding: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class ServiceListResponse(PaginatedResponse):
    items: list[ServiceResponse]


# --- Registry (machine-readable) ---

class RegistryAgentCard(BaseModel):
    """Minimal agent card for registry discovery."""
    name: str
    description: str
    url: str
    version: str | None = None
    skills: list[dict] = Field(default_factory=list)
    capabilities: dict = Field(default_factory=dict)
    defaultInputModes: list[str] = Field(default_factory=list)
    defaultOutputModes: list[str] = Field(default_factory=list)
    provider: dict | None = None


class RegistryAgentEntry(BaseModel):
    service_id: UUID
    slug: str
    visibility: str
    validation_status: str | None = None
    last_validated_at: datetime | None = None
    agent_card: RegistryAgentCard | None = None
