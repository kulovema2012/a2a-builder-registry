-- apps/api-rs/migrations/0001_initial.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE visibility AS ENUM ('draft', 'private', 'internal', 'public');
CREATE TYPE service_status AS ENUM ('active', 'suspended', 'delisted', 'pending_review');
CREATE TYPE validation_status AS ENUM ('pending', 'running', 'passed', 'failed', 'warning');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE protocol_binding AS ENUM ('JSONRPC', 'GRPC', 'HTTP+JSON');

-- organizations
CREATE TABLE organizations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    plan       VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_organizations_slug ON organizations(slug);

-- users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_organization_id ON users(organization_id);

-- services
CREATE TABLE services (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    description         TEXT,
    provider_name       VARCHAR(255),
    provider_url        VARCHAR(1024),
    visibility          visibility NOT NULL DEFAULT 'draft',
    status              service_status NOT NULL DEFAULT 'active',
    owner_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    current_snapshot_id UUID,
    tags                TEXT[] NOT NULL DEFAULT '{}',
    icon_url            VARCHAR(1024),
    documentation_url   VARCHAR(1024),
    version             VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ix_services_slug_org ON services(slug, organization_id);
CREATE INDEX ix_services_organization_id ON services(organization_id);

-- service_endpoints
CREATE TABLE service_endpoints (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id       UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    agent_card_url   VARCHAR(1024),
    base_url         VARCHAR(1024),
    protocol_binding protocol_binding NOT NULL DEFAULT 'JSONRPC',
    protocol_version VARCHAR(50) NOT NULL DEFAULT '0.2',
    tenant           VARCHAR(255),
    is_preferred     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_service_endpoints_service_id ON service_endpoints(service_id);

-- agent_card_snapshots
CREATE TABLE agent_card_snapshots (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id       UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    raw_json         JSONB NOT NULL,
    normalized_json  JSONB NOT NULL,
    schema_version   VARCHAR(50),
    checksum         VARCHAR(64),
    fetched_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_run_id UUID
);
CREATE INDEX ix_snapshots_service_created ON agent_card_snapshots(service_id, created_at);

-- skills
CREATE TABLE skills (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    external_skill_id VARCHAR(255),
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    tags              TEXT[] NOT NULL DEFAULT '{}',
    input_modes       TEXT[] NOT NULL DEFAULT '{}',
    output_modes      TEXT[] NOT NULL DEFAULT '{}',
    examples          JSONB,
    security_requirements JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_skills_service_id ON skills(service_id);

-- security_schemes
CREATE TABLE security_schemes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(100) NOT NULL,
    public_config JSONB,
    secret_ref   VARCHAR(255),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_security_schemes_service_id ON security_schemes(service_id);

-- validation_runs
CREATE TABLE validation_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    status          validation_status NOT NULL DEFAULT 'pending',
    score           INTEGER,
    checks          JSONB NOT NULL DEFAULT '[]',
    errors          JSONB NOT NULL DEFAULT '[]',
    warnings        JSONB NOT NULL DEFAULT '[]',
    response_time_ms INTEGER,
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_validation_runs_service_created ON validation_runs(service_id, created_at);

-- approval_requests
CREATE TABLE approval_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    reviewed_by  UUID REFERENCES users(id),
    status       approval_status NOT NULL DEFAULT 'pending',
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at  TIMESTAMPTZ
);
CREATE INDEX ix_approval_requests_service_id ON approval_requests(service_id);

-- registry_events
CREATE TABLE registry_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    actor_id   UUID,
    event_type VARCHAR(100) NOT NULL,
    metadata   JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_registry_events_service_id ON registry_events(service_id);
CREATE INDEX ix_registry_events_event_type ON registry_events(event_type);

-- api_keys
CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    hashed_key      VARCHAR(255) NOT NULL UNIQUE,
    scopes          TEXT[] NOT NULL DEFAULT '{}',
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ
);
CREATE INDEX ix_api_keys_organization_id ON api_keys(organization_id);
