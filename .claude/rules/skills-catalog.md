---
name: skills-catalog
description: Complete catalog of all available skills organized by category with when-to-use guidance. Run /skills for the live list.
type: rule
---

# Skills Catalog

> Run `/skills` in Claude Code for the always-current list. This catalog adds when-to-use context.

Invoke skills with the `Skill` tool **BEFORE taking any action** — even at 1% probability of relevance.

---

## Superpowers (Core Workflow)

These govern HOW to approach work — invoke before domain skills.

| Skill | Trigger | In This Project |
|---|---|---|
| `superpowers:brainstorming` | Starting any feature, component, or design | Before adding new endpoint, new model column, new page |
| `superpowers:systematic-debugging` | Any bug, test failure, unexpected behaviour | `AgentCardValidator` returning wrong score, 409 on valid slugs |
| `superpowers:writing-plans` | Multi-step implementation with a spec | Planning auth middleware, registry discovery filters |
| `superpowers:executing-plans` | Working through an existing plan | After writing-plans produces an implementation plan |
| `superpowers:verification-before-completion` | Before saying "done" | Before committing validation engine refactor |
| `superpowers:test-driven-development` | Any code change (feature or fix) | Before touching `validation_engine.py` or any endpoint |
| `superpowers:dispatching-parallel-agents` | 2+ independent implementation tasks | Frontend page + backend endpoint + tests simultaneously |
| `superpowers:using-git-worktrees` | Feature branch isolation | `git worktree add ../a2a-feat-X feat/X` |
| `superpowers:finishing-a-development-branch` | Merging a feature branch | Post-implementation, before PR |
| `superpowers:requesting-code-review` | Before PR creation | After all tests pass |
| `superpowers:receiving-code-review` | Acting on review feedback | After PR comments |
| `superpowers:subagent-driven-development` | Executing plans with independent tasks in current session | Parallel implementation within a session |
| `superpowers:writing-skills` | Creating polished written content | API docs, README, technical specs |

---

## Agent Teams

| Skill | Purpose |
|---|---|
| `agent-teams:team-spawn` | Start a team with preset (feature, fullstack, review, debug, security, migration, research) |
| `agent-teams:team-feature` | Parallel feature development with file ownership boundaries |
| `agent-teams:team-debug` | Competing hypotheses, parallel investigation |
| `agent-teams:team-review` | Multi-dimension code review (security + performance + architecture + tests) |
| `agent-teams:team-status` | Check team progress during execution |
| `agent-teams:team-shutdown` | Shut down team, collect and synthesize results |
| `agent-teams:team-delegate` | Delegate a subtask to a team member |
| `agent-teams:team-communication-protocols` | Inter-agent messaging patterns |
| `agent-teams:task-coordination-strategies` | Dependency management across agents |
| `agent-teams:parallel-feature-development` | File ownership patterns for parallel builds |
| `agent-teams:parallel-debugging` | Hypothesis distribution across debugger agents |
| `agent-teams:multi-reviewer-patterns` | Organizing parallel review dimensions |
| `agent-teams:team-composition-patterns` | Selecting agent types for a given task |

---

## Vercel / Next.js

| Skill | Use For |
|---|---|
| `vercel:nextjs` | Next.js 15 App Router patterns, RSC, Server Actions |
| `vercel:shadcn` | shadcn/ui component installation, theming, composition |
| `vercel:ai-sdk` | Vercel AI SDK streaming, tool use, agent hooks |
| `vercel:deploy` | Vercel deployment, environment config |
| `vercel:bootstrap` | New Next.js project scaffold |
| `vercel:auth` | Auth.js / NextAuth integration |
| `vercel:env-vars` | Managing environment variables across envs |
| `vercel:deployments-cicd` | CI/CD pipeline for Vercel |
| `vercel:chat-sdk` | AI chat UI components |
| `vercel:ai-gateway` | Vercel AI Gateway setup |
| `vercel:next-cache-components` | RSC caching strategies, `revalidate`, `cache()` |
| `vercel:react-best-practices` | React 19 patterns, concurrent features |
| `vercel:routing-middleware` | Edge middleware, rewrites, personalization |
| `vercel:turbopack` | Turbopack config and optimization |
| `vercel:vercel-functions` | Serverless and Edge functions |
| `vercel:vercel-storage` | Vercel KV, Blob, Postgres |
| `vercel:vercel-sandbox` | Sandboxed code execution |
| `vercel:vercel-firewall` | WAF rules, rate limiting |
| `vercel:vercel-cli` | CLI commands for Vercel |
| `vercel:verification` | Vercel deployment verification |
| `vercel:runtime-cache` | Cache headers, CDN optimization |
| `vercel:next-forge` | Next.js monorepo starter patterns |
| `vercel:next-upgrade` | Next.js version migration |
| `vercel:marketplace` | Vercel marketplace integrations |
| `vercel:workflow` | Vercel workflow automation |

---

## Backend Development

| Skill | Use For |
|---|---|
| `backend-development:feature-development` | Backend feature scaffold (FastAPI + SQLAlchemy) |
| `backend-development:architecture-patterns` | Service boundaries, dependency injection |
| `backend-development:api-design-principles` | REST conventions, response shapes, versioning |
| `backend-development:cqrs-implementation` | Command/query separation |
| `backend-development:event-store-design` | Event sourcing with `registry_events` table |
| `backend-development:microservices-patterns` | Service decomposition |
| `backend-development:projection-patterns` | Read model projections |
| `backend-development:saga-orchestration` | Distributed transaction workflows |
| `backend-development:temporal-python-testing` | Temporal workflow tests |
| `backend-development:workflow-orchestration-patterns` | Celery + async task patterns |

---

## TDD Workflows

| Skill | Use For |
|---|---|
| `tdd-workflows:tdd-cycle` | Full red-green-refactor cycle |
| `tdd-workflows:tdd-red` | Write failing test first |
| `tdd-workflows:tdd-green` | Minimal implementation to pass |

---

## Code Quality & Review

| Skill | Use For |
|---|---|
| `comprehensive-review:full-review` | Architecture + security + performance + testing sweep |
| `git-pr-workflows:git-workflow` | PR creation, branch management, commit workflow |
| `code-review` | Review current diff at configurable effort level |
| `codebase-cleanup:deps-audit` | Dependency vulnerability and drift audit |
| `codebase-cleanup:refactor-clean` | Targeted refactor for clarity/maintainability |
| `codebase-cleanup:tech-debt` | Technical debt identification and remediation |
| `code-documentation:docs-architect` | Long-form technical documentation from codebase |
| `code-documentation:tutorial-engineer` | Step-by-step tutorials from code |

---

## Database

| Skill | Use For |
|---|---|
| `database-design:postgresql` | PostgreSQL-specific patterns, JSONB, ARRAY, UUID |
| `database-migrations:sql-migrations` | Safe Alembic migrations for `a2a_registry` DB |
| `database-migrations:migration-observability` | Migration monitoring and rollback strategy |

---

## Security

| Skill | Use For |
|---|---|
| `security-scanning:security-hardening` | Harden FastAPI app, JWT, CORS |
| `security-scanning:security-sast` | Static analysis for secrets, injection |
| `security-scanning:threat-mitigation-mapping` | Map threats to mitigations |
| `security-scanning:stride-analysis-patterns` | STRIDE threat modeling |
| `security-scanning:attack-tree-construction` | Attack path analysis |

---

## CI/CD & Infrastructure

| Skill | Use For |
|---|---|
| `cicd-automation:github-actions-templates` | GitHub Actions for test/build/deploy |
| `cicd-automation:deployment-pipeline-design` | Pipeline architecture |
| `cicd-automation:secrets-management` | GitHub Secrets, Doppler, Vault |
| `cicd-automation:gitlab-ci-patterns` | GitLab CI/CD |

---

## Observability & Performance

| Skill | Use For |
|---|---|
| `observability-monitoring:prometheus-configuration` | Metrics config for FastAPI |
| `observability-monitoring:grafana-dashboards` | Dashboard building |
| `observability-monitoring:distributed-tracing` | OpenTelemetry in FastAPI |
| `observability-monitoring:slo-implementation` | SLI/SLO definitions |
| `application-performance:performance-optimization` | Response time, query, bundle optimization |

---

## AI & Agents

| Skill | Use For |
|---|---|
| `ai:building-pydantic-ai-agents` | Pydantic AI agent patterns (primary A2A framework) |
| `cloudflare:agents-sdk` | Cloudflare AI agents |
| `cloudflare:building-ai-agent-on-cloudflare` | Cloudflare agent deployment |
| `cloudflare:build-mcp` | MCP server on Cloudflare Workers |

---

## Frontend Design

| Skill | Use For |
|---|---|
| `frontend-design:frontend-design` | UI design system, component architecture |
| `frontend-mobile-development:tailwind-design-system` | Tailwind v4 design tokens |
| `frontend-mobile-development:nextjs-app-router-patterns` | App Router specific patterns |
| `frontend-mobile-development:react-state-management` | Zustand, Context, server state |

---

## Data Engineering

| Skill | Use For |
|---|---|
| `data-engineering:airflow` | Airflow DAGs for scheduled validation |
| `data-engineering:analyzing-data` | Data analysis workflows |
| `data-engineering:warehouse-init` | Data warehouse setup |

---

## Context Mode (Context Savings)

| Skill | Use For |
|---|---|
| `context-mode:ctx-stats` | Show context usage statistics |
| `context-mode:ctx-purge` | Wipe knowledge base |
| `context-mode:ctx-doctor` | Diagnose context-mode plugin |
| `context-mode:ctx-upgrade` | Upgrade context-mode |
| `context-mode:ctx-insight` | Get insights about indexed content |

---

## Utilities

| Skill | Use For |
|---|---|
| `update-config` | Modify `.claude/settings.json`, hooks, permissions |
| `keybindings-help` | Customize `~/.claude/keybindings.json` |
| `verify` | Run app and observe behaviour (not just tests) |
| `run` | Launch this project's app |
| `loop` | Recurring task at interval |
| `schedule` | One-time or cron scheduled remote agents |
| `claude-api` | Anthropic SDK integration, prompt caching |
| `fewer-permission-prompts` | Reduce repetitive permission prompts |
| `remember:remember` | Save facts to persistent memory |
| `hookify:configure` | Set up Claude Code hooks |
| `hookify:hookify` | Analyze conversation for hook opportunities |
| `claude-md-management:revise-claude-md` | Update CLAUDE.md with current conventions |
| `unified-council-analyst` | Strategic multi-perspective decision analysis |
| `critical-thinking-logical-reasoning` | Deep reasoning for complex problems |
| `agent-browser` | Browser automation for testing web UI |

---

## Memora (If Configured)

If the `memora` MCP server is connected, use it for persistent memory across sessions:

| Use Case | Operation |
|---|---|
| Save architecture decision | `memory_create` with type `decision` |
| Save discovered bug pattern | `memory_create` with type `bug` |
| Store roadmap items | `memory_store_document` |
| Find prior decisions | `memory_semantic_search "validation engine"` |
| Log session activity | `memory_create` with type `activity` |
| AI model learning notes | `memory_create` with type `learning` |

**Workflow:**
```
Before editing → memory_semantic_search for prior decisions
During editing → memory_create for each significant decision
After editing  → memory_store_document with final implementation notes
```
