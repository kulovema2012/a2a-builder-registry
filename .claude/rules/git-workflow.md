---
name: git-workflow
description: Strict atomic push workflow with local brainstorm checkpoint safeguard (git stash + .claude/checkpoints/). Gitmoji commit standard.
type: rule
---

# Git Workflow — Atomic Pushing + Brainstorm Checkpoints

## Full Workflow

```
Brainstorm → Local Checkpoint → Change → Test → Lint → Stage → Commit → Push → Next
```

Never batch unrelated changes. Never leave uncommitted work at session end.

---

## Layer 1 — Brainstorm Checkpoints (git stash)

Before any exploratory or design work, create a stash checkpoint:

```bash
# Save current state (fast, offline, crash-safe, no CI triggers)
git stash push -m "checkpoint: auth-middleware-design" --include-untracked

# List checkpoints
git stash list

# Recover
git stash pop stash@{0}
```

**When to checkpoint:**
- Start of every brainstorming session
- After generating a plan, before implementation begins
- When switching between ideas mid-session
- Before destructive operations (rebase, worktree switches, `git reset`)

---

## Layer 2 — Brainstorm Notes (.claude/checkpoints/)

Persist brainstorm output as timestamped markdown files:

```bash
# File naming: YYYY-MM-DD_<topic>.md
.claude/checkpoints/
├── 2025-05-25_validation-engine-redesign.md
├── 2025-05-25_auth-middleware-approach.md
└── 2025-05-26_registry-discovery-api.md
```

Checkpoint file structure:

```markdown
# Checkpoint: <topic> — 2025-05-25

## Context
Working on: apps/api-rs/src/validation/engine.rs
Branch: feat/validation-redesign

## Problem
AgentCardValidator.check_endpoint_reachability() blocks validation score
calculation — endpoint failures should warn, not fail.

## Approaches Considered
1. Make reachability a warning-only check
2. Separate reachability into its own async pipeline
3. Cache last-known reachability

## Decision
Option 2 — keeps ValidationResult.score pure, reachability is fire-and-forget.

## Implementation Plan
- [ ] Refactor validate_card() to accept fetch_endpoint=true param
- [ ] Add ValidationRun.reachability_status column
- [ ] Update validation::engine tests
```

---

## Transition to Implementation

```bash
# 1. Pop checkpoint stash (restore working state)
git stash pop

# 2. Store winning idea in Memora (if configured)
# memora create --type decision --title "..." --content "..."

# 3. Begin real atomic commits (never squash brainstorm commits into implementation)
```

---

## Atomic Push Workflow (Critical)

```
ONE change → cargo test / bun test → cargo clippy / eslint → git add <files> → git commit → git push → Next
```

### Rust (apps/api-rs)
```bash
cargo test
cargo clippy
git add apps/api-rs/src/validation/engine.rs
git commit -m "✨ feat(validation): separate reachability check from score calculation"
git push
```

### TypeScript (apps/web)
```bash
bun test
bun run lint
git add apps/web/src/lib/api.ts
git commit -m "✨ feat(api-client): add sendTestRequest to console API"
git push
```

### Violations — Never Do This
```
❌ Multiple logical changes before a single push
❌ "I'll push after this other fix too"
❌ git add -A or git add . (may catch .env, target/, .next/)
❌ Leaving uncommitted work at session end
❌ Using npm / pip / yarn / poetry
```

---

## Commit Message Format (Gitmoji Standard)

```
<emoji> <type>(<scope>): <description>
```

| Emoji | Type | Scope Examples | Usage |
|---|---|---|---|
| ✨ | feat | `validation`, `registry`, `console`, `auth` | New feature |
| 🐛 | fix | `services-route`, `agent-card` | Bug fix |
| ♻️ | refactor | `validation-engine`, `models` | Improve without behaviour change |
| 📝 | docs | `readme`, `api` | Documentation |
| ✅ | test | `validation`, `services` | Add or update tests |
| 🔧 | chore | `deps`, `docker`, `config` | Maintenance |
| ⚡ | perf | `db-queries`, `snapshots` | Performance improvement |
| 🎨 | style | `web`, `css` | Formatting only |
| 🧪 | experiment | `pgvector`, `a2a-protocol` | Non-production exploration |
| 🗃️ | db | `migrations`, `schema` | Database changes |

**Examples:**
```bash
git commit -m "✨ feat(validation): add check_sensitive_data to validation engine"
git commit -m "🐛 fix(services-route): resolve 409 false positive on slug uniqueness check"
git commit -m "✅ test(validation-engine): add tests for check_skills() duplicate id detection"
git commit -m "🗃️ db(schema): add reachability_status column to validation_runs"
```

---

## Branch Naming

```
feat/<short-description>      # feat/registry-discovery-filter
fix/<short-description>       # fix/agent-card-checksum-collision
db/<short-description>        # db/add-api-keys-table
```

---

## Staging (Always Specific Files)

```bash
# ✅ Specific — safe
git add apps/api-rs/src/models/service.rs
git add apps/api-rs/src/routes/services.rs

# ❌ Dangerous — catches .env, target/, .next/
git add .
git add -A
```

---

## Pull Request Description Template

Every implementation ends with a PR description:

```markdown
## What
[One sentence on what changed]

## Why
[Business reason or bug being fixed]

## Atomic Units
1. `apps/api-rs/src/models/service.rs` — [change]
2. `apps/api-rs/src/routes/services.rs` — [change]
3. `apps/api-rs/src/validation/engine.rs` — [tests]

## Test Coverage
- [ ] Unit tests added / updated
- [ ] `cargo test` passes
- [ ] `cargo clippy` passes
```
