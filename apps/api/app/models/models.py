import uuid
from datetime import datetime
from enum import StrEnum
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Integer, Float, Boolean,
    JSON, Enum, Index, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class Visibility(StrEnum):
    DRAFT = "draft"
    PRIVATE = "private"
    INTERNAL = "internal"
    PUBLIC = "public"


class ServiceStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELISTED = "delisted"
    PENDING_REVIEW = "pending_review"


class ValidationStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"


class ApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProtocolBinding(StrEnum):
    JSONRPC = "JSONRPC"
    GRPC = "GRPC"
    HTTP_JSON = "HTTP+JSON"


def utcnow():
    return datetime.utcnow()


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    plan = Column(String(50), default="free")
    created_at = Column(DateTime, default=utcnow)

    users = relationship("User", back_populates="organization")
    services = relationship("Service", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="member")
    created_at = Column(DateTime, default=utcnow)

    organization = relationship("Organization", back_populates="users")


class Service(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    description = Column(Text, default="")
    provider_name = Column(String(255))
    provider_url = Column(String(1024))
    visibility = Column(Enum(Visibility), default=Visibility.DRAFT)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.ACTIVE)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    current_snapshot_id = Column(UUID(as_uuid=True), nullable=True)
    tags = Column(ARRAY(String), default=list)
    icon_url = Column(String(1024), nullable=True)
    documentation_url = Column(String(1024), nullable=True)
    version = Column(String(50), default="1.0.0")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    organization = relationship("Organization", back_populates="services")
    endpoints = relationship("ServiceEndpoint", back_populates="service", cascade="all, delete-orphan")
    snapshots = relationship("AgentCardSnapshot", back_populates="service", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="service", cascade="all, delete-orphan")
    security_schemes = relationship("SecurityScheme", back_populates="service", cascade="all, delete-orphan")
    validation_runs = relationship("ValidationRun", back_populates="service", cascade="all, delete-orphan")
    approval_requests = relationship("ApprovalRequest", back_populates="service")

    __table_args__ = (Index("ix_services_slug_org", "slug", "organization_id", unique=True),)


class ServiceEndpoint(Base):
    __tablename__ = "service_endpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    agent_card_url = Column(String(1024), nullable=False)
    base_url = Column(String(1024), nullable=False)
    protocol_binding = Column(Enum(ProtocolBinding), default=ProtocolBinding.JSONRPC)
    protocol_version = Column(String(50), default="0.2")
    tenant = Column(String(255), nullable=True)
    is_preferred = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    service = relationship("Service", back_populates="endpoints")


class AgentCardSnapshot(Base):
    __tablename__ = "agent_card_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    raw_json = Column(JSON, nullable=False)
    normalized_json = Column(JSON, nullable=True)
    schema_version = Column(String(50))
    checksum = Column(String(64))
    fetched_at = Column(DateTime, default=utcnow)
    created_by_run_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    service = relationship("Service", back_populates="snapshots")

    __table_args__ = (Index("ix_snapshots_service_created", "service_id", "created_at"),)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    external_skill_id = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    tags = Column(ARRAY(String), default=list)
    input_modes = Column(ARRAY(String), default=list)
    output_modes = Column(ARRAY(String), default=list)
    examples = Column(JSON, default=list)
    security_requirements = Column(JSON, nullable=True)

    service = relationship("Service", back_populates="skills")


class SecurityScheme(Base):
    __tablename__ = "security_schemes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    public_config = Column(JSON, default=dict)
    secret_ref = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    service = relationship("Service", back_populates="security_schemes")


class ValidationRun(Base):
    __tablename__ = "validation_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    status = Column(Enum(ValidationStatus), default=ValidationStatus.PENDING)
    score = Column(Integer, default=0)
    checks = Column(JSON, default=list)
    errors = Column(JSON, default=list)
    warnings = Column(JSON, default=list)
    response_time_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    service = relationship("Service", back_populates="validation_runs")

    __table_args__ = (Index("ix_validation_runs_service_created", "service_id", "created_at"),)


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    service = relationship("Service", back_populates="approval_requests")


class RegistryEvent(Base):
    __tablename__ = "registry_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), nullable=True)
    event_type = Column(String(100), nullable=False, index=True)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utcnow)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_key = Column(String(255), nullable=False, unique=True)
    scopes = Column(ARRAY(String), default=list)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    revoked_at = Column(DateTime, nullable=True)
