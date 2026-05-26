---
name: project-structure
description: CLAUDE.md scaling rule, pointer architecture, path-specific rule scoping, monorepo anatomy for A2A Builder & Registry.
type: rule
---

# Project Structure & Organisation

## CLAUDE.md Scaling Rule

Keep `CLAUDE.md` under 200 lines. When it grows beyond that:

1. Create `.claude/rules/<topic>.md` for each concern
2. Reference via `@.claude/rules/<topic>.md` imports in CLAUDE.md
3. Rules are discovered recursively — subdirectories are fine

```
.claude/
├── CLAUDE.md                    # < 200 lines, index only
├── settings.json                # Enabled plugins
├── checkpoints/                 # Brainstorm checkpoint markdown files
└── rules/
    ├── environment.md           # gitignore, worktrees, bun/cargo
    ├── testing.md               # TDD, Rust test conventions
    ├── observability.md         # Tracing, monitoring stack
    ├── git-workflow.md          # Atomic commits, checkpoints, gitmoji
    ├── agent-orchestration.md   # Skill invocation, agent dispatch
    ├── project-structure.md     # This file
    ├── response-format.md       # Communication style
    ├── skills-catalog.md        # All skills by category
    └── agents-catalog.md        # All agents by domain
```

## Monorepo Anatomy

```
a2a-builder-register/
├── .claude/                     # AI tooling (gitignored)
├── .env.example                 # Committed template (no secrets)
├── docker-compose.yml           # Postgres:5432 + API-RS:8000 + Web:3001
├── apt/
│   └── codebase-structure.md    # Tech stack, schema, data flows
├── apps/
│   ├── api-rs/                  # Axum backend (Rust, cargo)
│   │   ├── src/
│   │   │   ├── main.rs          # Axum app, CORS, Tokio runtime
│   │   │   ├── config.rs        # Config (dotenvy, Config::from_env())
│   │   │   ├── db.rs            # PgPool, connection setup
│   │   │   ├── errors.rs        # AppError, thiserror, IntoResponse
│   │   │   ├── models/
│   │   │   │   ├── mod.rs       # Model re-exports
│   │   │   │   ├── service.rs   # Service, ServiceEndpoint, Skill, etc.
│   │   │   │   ├── user.rs      # User, Organization
│   │   │   │   ├── validation.rs # ValidationRun, ValidationResult
│   │   │   │   └── mcp.rs      # MCP-related models
│   │   │   ├── auth/
│   │   │   │   ├── mod.rs       # Auth re-exports
│   │   │   │   ├── jwt.rs       # JWT encode/decode (jsonwebtoken)
│   │   │   │   └── middleware.rs # Axum auth extractor middleware
│   │   │   ├── validation/
│   │   │   │   ├── mod.rs       # Validation re-exports
│   │   │   │   ├── engine.rs    # AgentCardValidator, normalize_agent_card
│   │   │   │   └── mcp_probe.rs # MCP endpoint probing
│   │   │   ├── mcp/
│   │   │   │   ├── mod.rs       # MCP re-exports
│   │   │   │   └── types.rs     # MCP protocol types
│   │   │   └── routes/
│   │   │       ├── mod.rs       # Router composition, prefix=/api/v1
│   │   │       ├── health.rs    # GET /health
│   │   │       ├── services.rs  # CRUD, endpoints, skills, snapshots, validation
│   │   │       ├── registry.rs  # GET /registry/agents, POST publish-request
│   │   │       ├── import.rs    # POST /services/import (from URL)
│   │   │       ├── console.rs   # POST /test-console/send
│   │   │       ├── admin.rs     # POST approve, POST suspend
│   │   │       ├── auth.rs      # POST /auth/login, /auth/register
│   │   │       └── mcp.rs      # MCP-related routes
│   │   ├── migrations/          # sqlx-cli migrations
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   └── web/                     # Next.js 15 frontend (bun)
│       ├── src/
│       │   ├── app/             # App Router (RSC-first)
│       │   │   ├── layout.tsx   # Root layout, Shell component
│       │   │   ├── page.tsx     # Dashboard / home
│       │   │   ├── services/    # /services, /services/[id], /services/import
│       │   │   ├── builder/     # Agent card builder
│       │   │   ├── registry/    # Discovery browser
│       │   │   ├── console/     # Test console
│       │   │   └── admin/       # Approval queue
│       │   ├── components/
│       │   │   └── shared/      # Shell, sidebar, icon, ui primitives
│       │   └── lib/
│       │       ├── api.ts       # apiFetch + typed API client
│       │       ├── data.ts      # Static/mock data
│       │       ├── helpers.ts   # Utility functions
│       │       └── json-view.tsx # JSON renderer component
│       ├── package.json
│       ├── next.config.ts
│       └── Dockerfile
└── design-system/               # Reference UI specs (JSX mockups)
    └── docs/                    # Screens, theme, component previews
```

## Pointer Architecture (Co-located Rules)

Local `rule.md` files in app directories act as **routers only** — they point to descriptive files co-located with source:

```
apps/api-rs/src/validation/
├── engine.rs
├── mcp_probe.rs
└── README.md              # "Modify validate_card()? Read engine.rs header first."

apps/web/src/app/
└── README.md              # "RSC-first. Mutations → Server Actions. See layout.tsx for Shell."
```

## Path-Specific Rules via YAML Frontmatter

Scope rules to file patterns:

```yaml
---
paths:
  - "apps/api-rs/src/models/service.rs"
  - "apps/api-rs/src/models/validation.rs"
---
# Schema & Model Conventions
# Always use UUID primary keys. Always add Index for FK columns used in WHERE clauses.
# ValidationRun.checks / .errors / .warnings are JSON arrays of ValidationResult dicts.
```

Rules without `paths:` apply globally.

## Single Responsibility Rule

| What | Where |
|---|---|
| Database schema / ORM | `apps/api-rs/src/models/*.rs` |
| Request/response serialization | `apps/api-rs/src/models/*.rs` (serde structs) |
| Business logic | `apps/api-rs/src/validation/*.rs`, `apps/api-rs/src/mcp/*.rs` |
| HTTP routing + state | `apps/api-rs/src/routes/*.rs` |
| Config / env | `apps/api-rs/src/config.rs` |
| DB pool | `apps/api-rs/src/db.rs` |
| Auth / JWT | `apps/api-rs/src/auth/*.rs` |
| Error types | `apps/api-rs/src/errors.rs` |
| Frontend API calls | `apps/web/src/lib/api.ts` |
| UI state / layout | `apps/web/src/components/shared/` |
| Page data fetching | `apps/web/src/app/**/page.tsx` (RSC) |

## Feature Addition Order

```
Model struct → sqlx migration → Route handler → Frontend type → UI component → Tests
```

Example: Adding `is_featured` to `Service`:
1. `models/service.rs` — add `is_featured: bool` field to `Service` struct
2. sqlx migration — `sqlx migrate add add_is_featured_to_services`
3. `routes/services.rs` — handle `is_featured` in `update_service`
4. `api.ts` — add to `Service` interface
5. UI — add toggle in Builder page
6. Tests — add test for `is_featured` filtering
