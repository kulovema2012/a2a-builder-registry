---
name: agent-orchestration
description: Task triage, tool selection, strategic delegation, skill invocation order, and agent team dispatch rules for A2A Builder & Registry work.
type: rule
---

# Agent & Tool Orchestration

## Task Triage — Before Any Action

Classify the request before touching code:

| Domain | Signal | Primary Agent |
|---|---|---|
| **UI / Frontend** | RSC, layout, `apps/web/src/`, CSS, shadcn | `application-performance:frontend-developer` |
| **API / Backend** | Axum routes, SQLx, serde models | `api-scaffolding:backend-architect` |
| **Database** | Models, migrations, sqlx-cli, `apps/api-rs/src/models/` | `database-design:database-architect` |
| **Agent Logic** | A2A protocol, validation engine, card generation | `api-scaffolding:backend-architect` |
| **Infrastructure** | Docker, CI/CD, Postgres config | `cicd-automation:deployment-engineer` |
| **Security** | JWT, CORS, secret scanning, OWASP | `backend-development:security-auditor` |
| **Performance** | Query optimization, N+1, caching, TTFB | `backend-development:performance-engineer` |

---

## Skill Invocation Rule

Invoke the relevant skill **BEFORE any response** — even if the task seems simple.

| Task Type | Skill | Why |
|---|---|---|
| Creating a feature or component | `superpowers:brainstorming` | Explore intent before touching code |
| Any bug or unexpected behaviour | `superpowers:systematic-debugging` | Hypothesis-first, not guess-first |
| Multi-step implementation with spec | `superpowers:writing-plans` | Atomic units before code |
| Executing an existing plan | `superpowers:executing-plans` | Review checkpoints, not freeform |
| Before claiming work is done | `superpowers:verification-before-completion` | Evidence before assertions |
| Any code change (feature or fix) | `superpowers:test-driven-development` | Red-green-refactor discipline |
| 2+ independent tasks | `superpowers:dispatching-parallel-agents` | Parallel over serial |
| Feature branch isolation | `superpowers:using-git-worktrees` | Protect main branch |

---

## Tool Selection

Read context before writing. Use the right tool for the right domain:

```
File reading   → Read (for files you'll edit), ctx_execute_file (for analysis)
Content search → Grep / ctx_batch_execute
File find      → Glob
Shell commands → Bash (git, docker-compose, test runners)
Code edits     → Edit (preferred), Write (new files or full rewrites)
External docs  → WebFetch / ctx_fetch_and_index
```

**Before editing any route in `apps/api-rs/src/routes/services.rs`:**
1. Read `apps/api-rs/src/models/service.rs` — verify struct fields and column names
2. Read `apps/api-rs/src/config.rs` — confirm env var names
3. Read `apps/api-rs/src/validation/engine.rs` — if touching validation flow
4. Read `apps/api-rs/src/errors.rs` — confirm error types

---

## Strategic Delegation

When the task spans disciplines, explicitly shift context:

```
"Switching to Database Architect mode — designing the validation_runs index strategy."
"Switching to Security Auditor mode — reviewing JWT claims and CORS policy."
"Switching to Frontend Developer mode — implementing the Registry page RSC."
```

If a required tool or context is missing, **halt and request it** rather than guessing:

```
"I need access to the sqlx migration history to safely add this column. 
Please run: ls apps/api-rs/migrations/"
```

---

## Agent Team Dispatch

Dispatch a team when the task has **3+ distinct implementation tasks** OR touches **2+ domains**.

```
superpowers:brainstorming → superpowers:dispatching-parallel-agents → agent-teams:team-spawn → agent-teams:team-status → agent-teams:team-shutdown
```

### Dispatch Triggers in This Project

| Scenario | Preset |
|---|---|
| New feature: model + route + frontend page | `fullstack` |
| Bug with multiple hypotheses | `debug` |
| Pre-PR code quality sweep | `review` |
| Auth system (JWT + middleware + tests) | `feature` |
| Validation engine + test coverage | `feature` |

### Priority Order

1. **Process skills first** — brainstorming, debugging determine HOW to approach
2. **If 3+ tasks** → dispatch team before any implementation
3. **Implementation skills second** — guide execution within the team

---

## Context Before Action

Before starting any task in this repo, read:

```bash
# Get current project state
cat apps/api-rs/src/models/service.rs         # DB model structs
cat apps/api-rs/src/config.rs                 # All env vars
cat apps/api-rs/src/routes/mod.rs             # Registered routes
cat apps/web/src/lib/api.ts                   # Frontend API client contracts
cat .claude/settings.json                     # Enabled plugins
```

Do not write code that assumes a table column, env var, or API route exists without verifying it first.
