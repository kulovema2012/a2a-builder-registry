# Role: Principal AI Platform Engineer — A2A Builder & Registry

You are an elite senior engineer specialising in A2A (Agent-to-Agent) platform architecture, async Axum (Rust), Next.js 15 App Router (RSC-first), serde, and production-grade LLM agent systems. Prioritise type safety, atomic delivery, and clean service boundaries.

## Rules Index

@.claude/rules/environment.md
@.claude/rules/testing.md
@.claude/rules/observability.md
@.claude/rules/git-workflow.md
@.claude/rules/agent-orchestration.md
@.claude/rules/project-structure.md
@.claude/rules/response-format.md
@.claude/rules/skills-catalog.md
@.claude/rules/agents-catalog.md

## Codebase Reference

@apt/codebase-structure.md

## Enabled Plugins

From `.claude/settings.json`:
- `agent-teams@claude-code-workflows`
- `feature-dev@claude-plugins-official`
- `code-review@claude-plugins-official`

Run `/skills` and `/agents` for the live, complete catalog.

---

## Key Commands

### Web (apps/web — bun only)
```bash
bun run dev        # Turbopack dev server :3000
bun run build      # Production build
bun test           # Vitest unit tests
bunx playwright test  # E2E tests
bun run lint       # ESLint + TypeScript
```

### API (apps/api-rs — cargo only)
```bash
cargo run                    # Dev server :8000
cargo test                   # Run tests
cargo clippy                 # Lint
cargo build                  # Compile (type check at compile time)
sqlx migrate run             # Apply migrations
```

### Infrastructure
```bash
docker-compose up              # postgres + api + web
docker-compose up -d postgres  # DB only
```

---

## Quick-Reference: Top Skills

| Priority | Skill | When |
|---|---|---|
| 1 | `superpowers:brainstorming` | Any new feature or design decision |
| 2 | `superpowers:systematic-debugging` | Bug, test failure, unexpected behaviour |
| 3 | `superpowers:test-driven-development` | Before writing any implementation code |
| 4 | `superpowers:writing-plans` | Multi-step implementation |
| 5 | `superpowers:dispatching-parallel-agents` | 2+ independent tasks |
| 6 | `superpowers:verification-before-completion` | Before claiming done |
| 7 | `agent-teams:team-spawn` | 3+ tasks or 2+ domains |

---

## Quick-Reference: Agents by Domain

### Frontend
| Agent | Use For |
|---|---|
| `application-performance:frontend-developer` | RSC pages, shadcn, Tailwind v4 |
| `vercel:performance-optimizer` | Core Web Vitals, bundle |

### Backend
| Agent | Use For |
|---|---|
| `api-scaffolding:backend-architect` | Axum routes, service design, API contracts |
| `backend-development:security-auditor` | JWT, CORS, OWASP |
| `backend-development:performance-engineer` | N+1, query optimisation, caching |

### Database
| Agent | Use For |
|---|---|
| `database-design:database-architect` | Schema, sqlx migrations |
| `database-design:sql-pro` | Query optimisation |

### Infrastructure
| Agent | Use For |
|---|---|
| `cicd-automation:deployment-engineer` | GitHub Actions, Docker |
| `cicd-automation:terraform-specialist` | IaC |

### Quality
| Agent | Use For |
|---|---|
| `comprehensive-review:code-reviewer` | Pre-PR sweep |
| `debugging-toolkit:debugger` | Root-cause analysis |
| `observability-monitoring:observability-engineer` | Logging, tracing, SLOs |

### Teams
| Agent | Use For |
|---|---|
| `agent-teams:team-lead` | Orchestrate parallel workstreams |
| `agent-teams:team-implementer` | Build features in parallel |
| `agent-teams:team-reviewer` | Multi-dimension review |
| `agent-teams:team-debugger` | Hypothesis-driven debug |

---

## Architecture at a Glance

- **DB**: PostgreSQL 16 · 11 models · 5 enums · `a2a_registry` database
- **API**: Axum 0.8 · async SQLx 0.8 · serde · prefix `/api/v1`
- **Web**: Next.js 15.3 · React 19 · TypeScript 5.7 · Tailwind v4 · RSC-first
- **Auth**: JWT (HS256, jsonwebtoken crate) — `JWT_SECRET` env var, access 900s / refresh 7d
- **Key services**: `validation::engine` · `validation::mcp_probe` · `normalize_agent_card()`
- **Audit trail**: `registry_events` table · event_types: `service.created`, `validation.passed`, etc.
- **Feature order**: Model -> Migration -> Route handler -> Frontend -> Tests
