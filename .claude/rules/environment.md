---
name: environment
description: Gitignore-first setup, task isolation via git worktrees, and strict package manager rules (bun for JS/TS, cargo for Rust)
type: rule
---

# Environment & Isolation

## Gitignore First

Before writing any project code, verify these entries exist in `.gitignore`:

```
# AI tooling — never commit
.claude/
CLAUDE.md
docs/superpowers/

# Secrets
.env
.env.local
.env.*.local
*.pem

# Dependencies & build
node_modules/
apps/web/.next/
apps/web/out/
apps/api-rs/target/
dist/
build/
```

This project's `.env` carries `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_API_URL`. Never commit these. The committed template is `.env.example`.

## Task Isolation — Git Worktrees

Every feature or bugfix runs in an isolated worktree. Never develop directly on `main`.

```bash
# Create a feature worktree
git worktree add ../a2a-feat-auth feat/auth-middleware

# List active worktrees
git worktree list

# Remove after merging
git worktree remove ../a2a-feat-auth
```

This keeps the `main` branch clean for `docker-compose up` and CI runs at all times.

## Package Manager: bun (JS/TS)

**Exclusively use `bun`.** Never use `npm`, `yarn`, or `pnpm`.

```bash
# Install dependencies
bun add <package>
bun add -d <package>          # dev dependency

# Run scripts (apps/web)
bun run dev                   # Turbopack dev server on :3000
bun run build                 # Production build
bun test                      # Vitest unit tests
bunx playwright test          # E2E tests
bun run lint                  # ESLint + TypeScript check

# Execute one-off binaries
bunx eslint apps/web/src/
bunx tsc --noEmit
```

## Build Tool: cargo (Rust)

**Exclusively use `cargo`.** Build, test, and lint the API with cargo.

```bash
# Run dev server (from apps/api-rs/)
cargo run                     # Starts on :8000

# Run tests
cargo test                    # All tests
cargo test test_validate      # Filter by name

# Lint
cargo clippy                  # Lint Rust code
cargo clippy -- -W clippy::all  # Strict mode

# Build
cargo build                   # Debug build
cargo build --release         # Optimised build

# Migrations (sqlx-cli)
sqlx migrate add <name>       # Generate migration
sqlx migrate run              # Apply migrations
sqlx migrate revert           # Revert last migration
```

## Required Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `DATABASE_URL` | `apps/api-rs/.env` | `postgresql://a2a:a2asecret@localhost:5432/a2a_registry` |
| `JWT_SECRET` | `apps/api-rs/.env` | Signing secret for `jsonwebtoken` crate — min 32 chars in production |
| `JWT_ACCESS_TTL_SECONDS` | `apps/api-rs/.env` | `900` (15 minutes) |
| `JWT_REFRESH_TTL_SECONDS` | `apps/api-rs/.env` | `604800` (7 days) |
| `PORT` | `apps/api-rs/.env` | `8000` |
| `CORS_ORIGINS` | `apps/api-rs/.env` | `http://localhost:3000` (comma-separated) |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | `http://localhost:8000` |
| `AGENT_CARD_FETCH_TIMEOUT_SECS` | `apps/api-rs/.env` | `10` (seconds, used by `AgentCardFetcher`) |
| `MCP_PROBE_TIMEOUT_SECS` | `apps/api-rs/.env` | `5` (seconds, used by MCP probe) |
| `RUST_LOG` | `apps/api-rs/.env` | `info` (controls tracing-subscriber verbosity) |

Config is loaded via `apps/api-rs/src/config.rs` → `Config::from_env()` (dotenvy).

## Local Services (Docker)

```bash
# Start Postgres + API + Web
docker-compose up

# API only (for frontend development)
docker-compose up postgres api-rs

# One-off database
docker-compose up -d postgres
```

Docker maps: `postgres:5432`, `api-rs:8000`, `web:3001→3000`.
