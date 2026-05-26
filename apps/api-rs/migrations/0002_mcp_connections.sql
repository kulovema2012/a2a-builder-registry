-- apps/api-rs/migrations/0002_mcp_connections.sql

-- MCP connections per service
CREATE TABLE mcp_connections (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    server_url   VARCHAR(1024) NOT NULL,
    transport    VARCHAR(50) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '[]',
    auth_type    VARCHAR(100),
    is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_mcp_connections_service_id ON mcp_connections(service_id);
CREATE INDEX ix_mcp_connections_server_url ON mcp_connections(server_url);

-- Delegation slugs (agent -> agent)
ALTER TABLE services ADD COLUMN delegates_to TEXT[] NOT NULL DEFAULT '{}';

-- Refresh tokens for dual-token auth
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens(user_id);
