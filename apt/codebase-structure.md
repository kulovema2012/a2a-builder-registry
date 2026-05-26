# A2A Builder & Registry — Codebase Structure

> Authoritative reference for tech stack, schema, data flows, and architecture patterns.
> Keep in sync with actual code. When in doubt, read the source.

---

## Tech Stack

### Backend (apps/api-rs)

| Layer | Technology | Version |
|---|---|---|
| Language | Rust | 2021 edition |
| Web framework | Axum | 0.8 |
| Async runtime | Tokio | 1 |
| Database | SQLx (async, compile-time checked) | 0.8 |
| Migrations | sqlx-cli | latest |
| Serialization | serde + serde_json | 1 |
| Settings | dotenvy | 0.15 |
| HTTP client | reqwest | 0.12 |
| Auth (JWT) | jsonwebtoken | 9 |
| Password hashing | argon2 | 0.5 |
| CORS | tower-http | 0.6 |
| Error handling | thiserror + anyhow | 2 / 1 |
| Observability | tracing + tracing-subscriber | 0.1 / 0.3 |
| Build tool | cargo | latest |

### Frontend (apps/web)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 15.3.0 |
| Runtime | React | 19.1.0 |
| Language | TypeScript | 5.7.0 |
| Styling | Tailwind CSS | 4.0.0 |
| Icons | lucide-react | 0.468.0 |
| Utilities | clsx | 2.1.1 |
| Package manager | bun | latest |

### Infrastructure

| Service | Technology | Version |
|---|---|---|
| Database | PostgreSQL | 16 (alpine) |
| Containerization | Docker + Docker Compose | — |
| Auth tokens | HS256 JWT (jsonwebtoken) | — |

---

## Directory Map

```
a2a-builder-register/
├── .claude/
│   ├── settings.json                    # Enabled plugins: agent-teams, feature-dev, code-review
│   ├── checkpoints/                     # Brainstorm notes (gitignored)
│   └── rules/
│       ├── environment.md               # bun/cargo, gitignore, worktrees
│       ├── testing.md                   # TDD, Rust test conventions
│       ├── observability.md             # Structured tracing, Loki/Grafana/Tempo
│       ├── git-workflow.md              # Atomic commits, gitmoji, checkpoints
│       ├── agent-orchestration.md       # Skills, agent dispatch, triage
│       ├── project-structure.md         # Monorepo anatomy, pointer arch
│       ├── response-format.md           # Why-first, single solution, code blocks
│       ├── skills-catalog.md            # All skills by category
│       └── agents-catalog.md            # All agents by domain
│
├── apt/
│   └── codebase-structure.md           # This file
│
├── apps/
│   ├── api-rs/                          # Axum backend (Rust, cargo)
│   │   ├── src/
│   │   │   ├── main.rs                  # Axum app, CORS, Tokio runtime
│   │   │   ├── config.rs                # Config (dotenvy, Config::from_env())
│   │   │   ├── db.rs                    # PgPool, connection setup
│   │   │   ├── errors.rs                # AppError, thiserror derive, IntoResponse
│   │   │   ├── models/
│   │   │   │   ├── mod.rs               # Model re-exports
│   │   │   │   ├── service.rs           # Service, ServiceEndpoint, Skill, etc.
│   │   │   │   ├── user.rs              # User, Organization
│   │   │   │   ├── validation.rs        # ValidationRun, ValidationResult
│   │   │   │   └── mcp.rs              # MCP-related models
│   │   │   ├── auth/
│   │   │   │   ├── mod.rs               # Auth re-exports
│   │   │   │   ├── jwt.rs               # JWT encode/decode (jsonwebtoken)
│   │   │   │   └── middleware.rs        # Axum auth extractor middleware
│   │   │   ├── validation/
│   │   │   │   ├── mod.rs               # Validation re-exports
│   │   │   │   ├── engine.rs            # AgentCardValidator, normalize_agent_card
│   │   │   │   └── mcp_probe.rs         # MCP endpoint probing
│   │   │   ├── mcp/
│   │   │   │   ├── mod.rs               # MCP re-exports
│   │   │   │   └── types.rs             # MCP protocol types
│   │   │   └── routes/
│   │   │       ├── mod.rs               # Router composition, prefix=/api/v1
│   │   │       ├── health.rs            # GET /health
│   │   │       ├── services.rs          # CRUD, endpoints, skills, snapshots, validation
│   │   │       ├── registry.rs          # GET /registry/agents, POST publish-request
│   │   │       ├── import.rs            # POST /services/import (from URL)
│   │   │       ├── console.rs           # POST /test-console/send
│   │   │       ├── admin.rs             # POST approve, POST suspend
│   │   │       ├── auth.rs              # POST /auth/login, /auth/register
│   │   │       └── mcp.rs              # MCP-related routes
│   │   ├── migrations/                  # sqlx-cli migrations
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   └── web/                            # Next.js 15 App Router
│       ├── src/
│       │   ├── app/                    # RSC-first pages
│       │   │   ├── layout.tsx          # RootLayout → Shell component
│       │   │   ├── page.tsx            # Dashboard / home
│       │   │   ├── globals.css         # Tailwind v4 + Geist/Instrument Serif fonts
│       │   │   ├── services/
│       │   │   │   ├── page.tsx        # Service list (RSC)
│       │   │   │   ├── [id]/page.tsx   # Service detail (RSC)
│       │   │   │   └── import/page.tsx # Import agent card from URL
│       │   │   ├── builder/page.tsx    # Agent card builder
│       │   │   ├── registry/page.tsx   # Discovery browser
│       │   │   ├── console/page.tsx    # Test console
│       │   │   └── admin/page.tsx      # Approval queue
│       │   ├── components/shared/
│       │   │   ├── shell.tsx           # App shell (sidebar + layout)
│       │   │   ├── sidebar.tsx         # Navigation sidebar
│       │   │   ├── ui.tsx              # shadcn-style primitives
│       │   │   └── icon.tsx            # Icon component wrapper
│       │   └── lib/
│       │       ├── api.ts              # apiFetch<T>() + typed api.* client
│       │       ├── data.ts             # Static/mock data
│       │       ├── helpers.ts          # Utility functions
│       │       └── json-view.tsx       # JSON tree renderer
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── postcss.config.mjs
│       └── Dockerfile
│
├── design-system/
│   └── docs/                           # Reference JSX mockups + screenshots
│
├── docker-compose.yml                  # postgres:5432, api-rs:8000, web:3001→3000
├── .env.example                        # Committed secrets template
├── .gitignore
└── CLAUDE.md                           # AI tooling index (< 200 lines)
```

---

## Database Schema

Database: `a2a_registry` (PostgreSQL 16)
Connection: `postgresql://a2a:a2asecret@localhost:5432/a2a_registry`

### Enums

| Enum | Values |
|---|---|
| `Visibility` | `draft`, `private`, `internal`, `public` |
| `ServiceStatus` | `active`, `suspended`, `delisted`, `pending_review` |
| `ValidationStatus` | `pending`, `running`, `passed`, `failed`, `warning` |
| `ApprovalStatus` | `pending`, `approved`, `rejected` |
| `ProtocolBinding` | `JSONRPC`, `GRPC`, `HTTP+JSON` |

### Tables

#### `organizations`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | default uuid4 |
| `name` | String(255) | not null |
| `slug` | String(100) | unique, indexed |
| `plan` | String(50) | default `"free"` |
| `created_at` | DateTime | |

#### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK → organizations | not null |
| `name` | String(255) | not null |
| `email` | String(255) | unique, indexed |
| `password_hash` | String(255) | argon2 hash |
| `role` | String(50) | default `"member"` |
| `created_at` | DateTime | |

#### `services`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK → organizations | not null |
| `name` | String(255) | not null |
| `slug` | String(100) | indexed; unique with org: `ix_services_slug_org` |
| `description` | Text | |
| `provider_name` | String(255) | |
| `provider_url` | String(1024) | |
| `visibility` | Enum(Visibility) | default `draft` |
| `status` | Enum(ServiceStatus) | default `active` |
| `owner_user_id` | UUID FK → users | nullable |
| `current_snapshot_id` | UUID | nullable, points to latest snapshot |
| `tags` | ARRAY(String) | PostgreSQL array |
| `icon_url` | String(1024) | nullable |
| `documentation_url` | String(1024) | nullable |
| `version` | String(50) | default `"1.0.0"` |
| `created_at` / `updated_at` | DateTime | |

#### `service_endpoints`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `service_id` | UUID FK → services | indexed |
| `agent_card_url` | String(1024) | `.well-known/agent-card.json` URL |
| `base_url` | String(1024) | |
| `protocol_binding` | Enum(ProtocolBinding) | default `JSONRPC` |
| `protocol_version` | String(50) | default `"0.2"` |
| `tenant` | String(255) | nullable |
| `is_preferred` | Boolean | default True |

#### `agent_card_snapshots`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `service_id` | UUID FK → services | indexed |
| `raw_json` | JSON | fetched card verbatim |
| `normalized_json` | JSON | output of `normalize_agent_card()` |
| `schema_version` | String(50) | |
| `checksum` | String(64) | SHA-256 of raw_json |
| `fetched_at` / `created_at` | DateTime | |
| `created_by_run_id` | UUID | nullable |
> Index: `ix_snapshots_service_created` on (service_id, created_at)

#### `skills`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `service_id` | UUID FK → services | indexed |
| `external_skill_id` | String(255) | nullable, from agent card |
| `name` | String(255) | not null |
| `description` | Text | |
| `tags` | ARRAY(String) | |
| `input_modes` | ARRAY(String) | MIME types |
| `output_modes` | ARRAY(String) | MIME types |
| `examples` | JSON | list of example dicts |
| `security_requirements` | JSON | nullable |

#### `security_schemes`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `service_id` | UUID FK → services | indexed |
| `name` | String(255) | scheme name |
| `type` | String(100) | e.g. `"apiKey"`, `"http"`, `"oauth2"` |
| `public_config` | JSON | non-secret config |
| `secret_ref` | String(255) | nullable, reference to secret store |

#### `validation_runs`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `service_id` | UUID FK → services | indexed |
| `status` | Enum(ValidationStatus) | default `pending` |
| `score` | Integer | 0–100, from `ValidationResult.score` |
| `checks` | JSON | list of check dicts |
| `errors` | JSON | subset of checks where status=failed |
| `warnings` | JSON | subset of checks where status=warning |
| `response_time_ms` | Integer | nullable |
| `started_at` / `finished_at` / `created_at` | DateTime | |
> Index: `ix_validation_runs_service_created` on (service_id, created_at)

#### `approval_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `service_id` | UUID FK → services | indexed |
| `requested_by` | UUID FK → users | not null |
| `reviewed_by` | UUID FK → users | nullable |
| `status` | Enum(ApprovalStatus) | default `pending` |
| `notes` | Text | nullable |
| `created_at` / `reviewed_at` | DateTime | |

#### `registry_events`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `service_id` | UUID FK → services | indexed |
| `actor_id` | UUID | nullable |
| `event_type` | String(100) | indexed; e.g. `service.created`, `validation.passed` |
| `metadata` | JSON (column: `metadata`) | event payload |
| `created_at` | DateTime | |

#### `api_keys`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `organization_id` | UUID FK → organizations | indexed |
| `name` | String(255) | |
| `hashed_key` | String(255) | unique, argon2 hash |
| `scopes` | ARRAY(String) | |
| `last_used_at` / `created_at` / `revoked_at` | DateTime | |

---

## API Routes

Base prefix: `/api/v1`

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/health` | `routes::health` | Health check |
| `POST` | `/auth/login` | `routes::auth` | Login, return JWT |
| `POST` | `/auth/register` | `routes::auth` | Register user |
| `POST` | `/services` | `routes::services` | Create service |
| `GET` | `/services` | `routes::services` | List with filters (q, visibility, status, tags, skill, provider, page) |
| `GET` | `/services/{id}` | `routes::services` | Get service detail |
| `PATCH` | `/services/{id}` | `routes::services` | Update service fields |
| `DELETE` | `/services/{id}` | `routes::services` | Delete service |
| `POST` | `/services/{id}/endpoints` | `routes::services` | Add service endpoint |
| `GET` | `/services/{id}/endpoints` | `routes::services` | List endpoints |
| `POST` | `/services/{id}/skills` | `routes::services` | Add skill |
| `GET` | `/services/{id}/skills` | `routes::services` | List skills |
| `POST` | `/services/{id}/validate` | `routes::services` | Trigger validation run |
| `GET` | `/services/{id}/validation-runs` | `routes::services` | List validation history |
| `POST` | `/services/{id}/agent-card/generate` | `routes::services` | Generate agent card |
| `GET` | `/services/{id}/agent-card` | `routes::services` | Get latest snapshot |
| `POST` | `/services/import` | `routes::import` | Import agent card from URL |
| `GET` | `/registry/agents` | `routes::registry` | Discover public agents |
| `POST` | `/registry/services/{id}/publish-request` | `routes::registry` | Request publication |
| `POST` | `/test-console/send` | `routes::console` | Send test request to agent |
| `POST` | `/admin/services/{id}/approve` | `routes::admin` | Approve/reject service |
| `POST` | `/admin/services/{id}/suspend` | `routes::admin` | Suspend service |

---

## Frontend Routes

| Route | Component | Type |
|---|---|---|
| `/` | `app/page.tsx` | RSC (dashboard) |
| `/services` | `app/services/page.tsx` | RSC (list) |
| `/services/[id]` | `app/services/[id]/page.tsx` | RSC (detail) |
| `/services/import` | `app/services/import/page.tsx` | RSC (import form) |
| `/builder` | `app/builder/page.tsx` | RSC (agent card builder) |
| `/registry` | `app/registry/page.tsx` | RSC (discovery browser) |
| `/console` | `app/console/page.tsx` | Client component (interactive console) |
| `/admin` | `app/admin/page.tsx` | RSC (approval queue) |

---

## Data Flow

### Service Registration Flow
```
User fills Builder form
  → POST /api/v1/services                    (routes::services)
  → INSERT INTO services
  → INSERT INTO registry_events (service.created)
  → POST /api/v1/services/{id}/endpoints      (routes::services)
  → POST /api/v1/services/{id}/skills         (routes::services)
  → POST /api/v1/services/{id}/validate       (routes::services)
    → validation::engine::validate_card()
    → reqwest fetch (agent_card_url)
    → INSERT INTO validation_runs
    → INSERT INTO registry_events (validation.passed/failed)
  → POST /registry/services/{id}/publish-request
    → INSERT INTO approval_requests
```

### Agent Card Import Flow
```
User enters URL in Import page
  → POST /api/v1/services/import { agent_card_url }
  → reqwest::get(url)
  → normalize_agent_card(raw_json)
  → compute_checksum(raw_json)
  → INSERT INTO services (from card metadata)
  → INSERT INTO agent_card_snapshots
  → INSERT INTO service_endpoints
  → INSERT INTO skills (from card.skills[])
```

### Discovery Flow
```
GET /api/v1/registry/agents?q=summarizer&tags=nlp
  → SELECT services WHERE visibility=public AND status=active
  → JOIN agent_card_snapshots (latest per service)
  → Filter by tags OVERLAP, skill name ILIKE
  → Return RegistryAgent[] (service_id, slug, agent_card)
```

### Validation Flow (validation::engine)
```
validate_card(card_data) →
  check_required_fields()    # name, description, url
  check_string_fields()      # length limits
  check_url_format()         # https:// preference
  check_capabilities()       # streaming, pushNotifications booleans
  check_skills()             # id, name, description; unique ids; media types
  check_interfaces()         # url required; protocolBinding enum
  check_default_modes()      # VALID_MEDIA_TYPES
  check_security()           # securitySchemes structure
  check_sensitive_data()     # find_sensitive_keys() recursion
  check_endpoint_reachability() # GET {url}/.well-known/agent-card.json
→ ValidationResult.score = passed_checks / total_checks * 100
```

---

## Authentication Flow

Current implementation uses JWT via `jsonwebtoken` crate:

```
POST /auth/login { email, password }
  → SELECT users WHERE email=$1
  → argon2::verify(password, user.password_hash)
  → jsonwebtoken::encode({ sub: user.id, org: org_id, role: role }, JWT_SECRET, HS256)
  → Return { access_token, token_type: "bearer" }

Protected routes:
  → Authorization: Bearer <token>
  → jsonwebtoken::decode(token, JWT_SECRET) → claims
  → Auth middleware extracts current_user from Axum State
```

> Note: Auth is partially stubbed. `create_service` uses hardcoded `organization_id = "00000000-0000-0000-0000-000000000001"`. Full auth integration is pending.

---

## Architectural Patterns

| Pattern | Where Used |
|---|---|
| **RSC-first** | All `apps/web/src/app/**/page.tsx` — data fetched server-side |
| **State extraction** | Axum `State(pool)`, `State(config)` via `Router::with_state()` |
| **Repository-ish** | Route handlers own DB queries via `sqlx::query()` (no separate repo layer yet) |
| **Audit Log** | `registry_events` table — every state change emits an event |
| **Snapshot pattern** | `agent_card_snapshots` — immutable point-in-time card captures |
| **Async-first** | All DB ops via `sqlx::PgPool`; `reqwest` for outbound HTTP |
| **Serde boundary** | All external inputs validated via serde deserialize before DB write |
| **Environment config** | `Config::from_env()` loaded via `dotenvy` |
| **Typed errors** | `AppError` (thiserror) implements `IntoResponse` for Axum |

---

## File Naming Conventions

| Domain | Convention | Example |
|---|---|---|
| Rust modules | `snake_case` | `validation_engine.rs` → `validation/engine.rs` |
| Rust test functions | `snake_case` | `fn test_validate_card_fails_on_missing_name()` |
| Rust structs / enums | `PascalCase` | `AgentCardValidator` |
| TypeScript files | `camelCase` or `kebab-case` | `api.ts`, `json-view.tsx` |
| Next.js pages | `page.tsx` in route directory | `app/services/[id]/page.tsx` |
| React components | `PascalCase` function name | `export function Shell()` |
| Environment vars | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |
| Slugs | `kebab-case` | `my-summarizer-agent` |
| Git branches | `feat/` or `fix/` prefix | `feat/registry-discovery-filter` |
| Commit messages | Gitmoji + conventional | `✨ feat(validation): ...` |

---

## NPM Scripts (apps/web)

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Turbopack dev server on :3000 |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | ESLint + TypeScript check |

## Cargo Commands (apps/api-rs)

| Command | Description |
|---|---|
| `cargo run` | Dev server on :8000 |
| `cargo test` | Run test suite |
| `cargo clippy` | Lint Rust code |
| `cargo build` | Compile (type check happens at compile time) |
| `sqlx migrate add <name>` | Generate migration |
| `sqlx migrate run` | Apply migrations |
