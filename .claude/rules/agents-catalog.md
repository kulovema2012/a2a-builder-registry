---
name: agents-catalog
description: Complete catalog of all available agent types organized by domain. Run /agents for the live list.
type: rule
---

# Agents Catalog

> Run `/agents` in Claude Code for the always-current list. This catalog adds context on when to use each agent.

Explore the project and task first, then select the most appropriate agent. Spawn a team (via `agent-teams:team-spawn`) whenever the task involves 3+ tasks, multiple files, or parallel workstreams.

---

## Exploration & Planning

| Agent | Use For | Example in This Project |
|---|---|---|
| `Explore` | Finding files, understanding architecture, codebase maps | "Where is endpoint reachability validated?" → find `_check_endpoint_reachability` |
| `Plan` | Implementation strategy, architectural decisions, trade-off analysis | Designing the approval workflow, registry discovery algorithm |
| `general-purpose` | Complex multi-step research across domains | Research A2A protocol spec, evaluate pgvector vs Qdrant |

---

## Frontend

| Agent | Use For | Example in This Project |
|---|---|---|
| `application-performance:frontend-developer` | React components, RSC layouts, Tailwind, shadcn | Builder page, Registry browser, console UI |
| `frontend-mobile-development:frontend-developer` | React Native, cross-platform | Mobile client for registry |
| `vercel:performance-optimizer` | Core Web Vitals, bundle analysis, image optimization | Optimize Registry page initial load |

---

## Backend

| Agent | Use For | Example in This Project |
|---|---|---|
| `api-scaffolding:backend-architect` | FastAPI endpoint design, service boundaries, REST conventions | Design `/registry/agents` discovery endpoint |
| `api-scaffolding:fastapi-pro` | Async FastAPI, SQLAlchemy 2.0 async, Pydantic v2 | `AgentCardValidator.validate_card()`, `AgentCardFetcher.fetch()` |
| `api-scaffolding:graphql-architect` | GraphQL schema, federation | If registry needs GraphQL discovery API |
| `backend-development:performance-engineer` | Query optimization, N+1, caching, selectinload | Fix slow `list_services` with skill subquery |
| `backend-development:security-auditor` | OWASP, JWT security, CORS policy, secret scanning | Audit `JWT_SECRET` handling, CORS origins |
| `backend-development:tdd-orchestrator` | TDD enforcement across the team | Enforce red-green-refactor on validation engine |
| `backend-development:temporal-python-pro` | Temporal workflow orchestration | Long-running agent card validation pipelines |

---

## Database

| Agent | Use For | Example in This Project |
|---|---|---|
| `database-design:database-architect` | Schema design, tech selection, Alembic migrations | Add `pgvector` extension for semantic skill search |
| `database-design:sql-pro` | Query optimization, OLAP/OLTP, JSONB queries | Optimize `validation_runs` queries with `ix_validation_runs_service_created` index |
| `database-migrations:database-optimizer` | Index tuning, N+1 resolution, connection pooling | Optimize `service_endpoints` join performance |
| `database-migrations:database-admin` | AWS RDS, backup/restore, HA config | Production Postgres on RDS |

---

## Data Engineering

| Agent | Use For | Example in This Project |
|---|---|---|
| `data-engineering:data-engineer` | Scalable pipelines, dbt, Airflow | Scheduled re-validation of all registered agents |
| `observability-monitoring:database-optimizer` | DB performance monitoring | Slow query detection on `registry_events` |

---

## Infrastructure & DevOps

| Agent | Use For | Example in This Project |
|---|---|---|
| `cicd-automation:deployment-engineer` | GitHub Actions, Docker builds, zero-downtime deploys | CI for `apps/api` tests + `apps/web` build |
| `cicd-automation:kubernetes-architect` | K8s, EKS/GKE/AKS, Helm | Kubernetes deployment of API + web + Postgres |
| `cicd-automation:terraform-specialist` | IaC, state management, module design | Terraform for RDS, ECS, ALB |
| `cicd-automation:devops-troubleshooter` | Incident response, log analysis, debugging deploys | Debug Docker build failures, container crashes |
| `cloud-infrastructure:cloud-architect` | Multi-cloud, FinOps, disaster recovery | AWS architecture for production A2A Registry |
| `cloud-infrastructure:network-engineer` | VPC, SSL/TLS, load balancing, CDN | Cloudfront + ALB for registry API |

---

## Quality & Monitoring

| Agent | Use For | Example in This Project |
|---|---|---|
| `comprehensive-review:code-reviewer` | Code quality, security, performance sweep | Pre-PR review of validation engine changes |
| `comprehensive-review:security-auditor` | OWASP, DevSecOps, compliance | Audit `api_keys` hashed_key storage, JWT claims |
| `comprehensive-review:architect-review` | Architectural integrity, clean boundaries | Review service/endpoint/skill relationship design |
| `observability-monitoring:observability-engineer` | Logging, tracing, SLOs | Wire OpenTelemetry into FastAPI lifespan |
| `debugging-toolkit:debugger` | Errors, test failures, unexpected behaviour | Debug `ValidationResult.score` calculation |
| `debugging-toolkit:dx-optimizer` | Developer experience, tooling setup | Improve local dev setup, `docker-compose` workflow |
| `observability-monitoring:performance-engineer` | Response time, load testing, Core Web Vitals | Load test `/registry/agents` discovery endpoint |

---

## Agent Teams

| Agent | Use For |
|---|---|
| `agent-teams:team-lead` | Orchestrate parallel workstreams, decompose tasks, synthesize results |
| `agent-teams:team-implementer` | Parallel feature building within strict file ownership |
| `agent-teams:team-debugger` | Hypothesis-driven debugging, one hypothesis per agent |
| `agent-teams:team-reviewer` | Parallel review: security, performance, architecture, testing, accessibility |

### Team Presets for This Project

| Preset | When to Use |
|---|---|
| `fullstack` | New feature spanning FastAPI endpoint + Next.js page + tests |
| `feature` | Pure backend: model + schema + endpoint + tests |
| `review` | Pre-merge quality sweep: architecture + security + performance |
| `debug` | Multiple hypotheses: 2+ agents investigating concurrently |
| `security` | Auth overhaul, API key management, CORS audit |
| `migration` | Alembic migrations + schema changes + backward compat |

---

## Security

| Agent | Use For |
|---|---|
| `backend-development:security-auditor` | OWASP Top 10, auth flows, secrets |
| `frontend-mobile-security:frontend-security-coder` | XSS prevention, CSP, sanitization in Next.js |
| `security-scanning:threat-modeling-expert` | STRIDE/PASTA for A2A attack surface |

---

## Scripting & Automation

| Agent | Use For |
|---|---|
| `shell-scripting:bash-pro` | Production Bash scripts for CI, deploy, data migration |
| `shell-scripting:posix-shell-pro` | Portable POSIX sh for cross-platform scripts |

---

## Framework Migration

| Agent | Use For |
|---|---|
| `framework-migration:legacy-modernizer` | Migrating from sync SQLAlchemy to async |
| `framework-migration:react-modernization` | React 18 → 19 class component removal |
| `code-refactoring:legacy-modernizer` | General legacy code modernization |

---

## Vercel Specialists

| Agent | Use For |
|---|---|
| `vercel:ai-architect` | AI SDK patterns, streaming, agent hooks in Next.js |
| `vercel:deployment-expert` | Deploy pipeline, preview URLs, rollbacks |
| `vercel:performance-optimizer` | Lighthouse, Core Web Vitals, RSC optimization |

---

## General

| Agent | Use For |
|---|---|
| `claude` | Catch-all for tasks not matching a specialist |
| `claude-code-guide` | Questions about Claude Code features, hooks, MCP |
| `business-analytics:business-analyst` | KPI dashboards, analytics for registry usage |
