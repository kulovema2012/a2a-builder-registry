---
name: response-format
description: Communication style: explain Why before code, single optimal solution, mandatory codebase exploration before writing, code blocks with file names.
type: rule
---

# Response Format & Communication Standards

## Think Step-by-Step. Explain Why First.

Before writing any code, briefly explain **why** this approach is optimal. One sentence is enough for simple cases; 2-3 for architectural decisions.

```
# ❌ Jumps straight to code
Here's the fix:
[code block]

# ✅ Why first
Using `sqlx::query_as!` instead of `sqlx::query()` here gives compile-time checked SQL —
the macro validates column names against the database schema at build time.
[code block with file name]
```

## Single Optimal Solution

Provide **one** solution — the best one — rather than 2-3 mediocre alternatives. If trade-offs exist, state them in one sentence before the code.

```
# ❌ Multiple mediocre options
Option A: ...
Option B: ...
Option C: ...

# ✅ Single optimal with context
Spawn a tokio task for validation so the HTTP response returns immediately.
The alternative (inline await) would block the request for ~2-10s on every card fetch.
[single implementation]
```

## Code Block Format

Every code block must include the file path:

````markdown
```rust
// apps/api-rs/src/validation/engine.rs
pub async fn validate_card(card_data: &serde_json::Value, fetch_endpoint: bool) -> ValidationResult {
```
````

````markdown
```typescript
// apps/web/src/lib/api.ts
export const api = {
  validateService: (serviceId: string) =>
    apiFetch<ValidationRun>(`/services/${serviceId}/validate`, { method: "POST" }),
}
```
````

## Codebase Exploration Protocol

Before writing any code, read these files in order:

1. `apps/api-rs/src/models/service.rs` — column names, serde structs
2. `apps/api-rs/src/config.rs` — env var names (never guess variable names)
3. `apps/api-rs/src/routes/mod.rs` — registered prefixes
4. `apps/api-rs/src/errors.rs` — error types and response shapes
5. `apps/web/src/lib/api.ts` — TypeScript interfaces and API function signatures
6. `.claude/settings.json` — enabled plugins (affects skill availability)
7. Relevant route file (e.g., `apps/api-rs/src/routes/services.rs`)

Also check for existing `.claude/rules/` files — they constrain your approach.

## Atomic Unit Presentation

Present changes as numbered atomic units:

```
## Changes

1. **apps/api-rs/src/models/validation.rs** — Add `reachability_status` field to `ValidationRun`
2. **apps/api-rs/src/validation/engine.rs** — Split endpoint check into separate async method
3. **apps/api-rs/src/validation/engine.rs** — Add tests for the new method
```

Then provide each code block with its file path.

## Terminal Commands at the End

Always close an implementation with the exact commands to run:

```bash
# Verify
cargo test
cargo clippy

# Commit
git add apps/api-rs/src/validation/engine.rs apps/api-rs/src/models/validation.rs
git commit -m "♻️ refactor(validation): separate reachability into async pipeline"
git push
```

## Length Calibration

| Request Type | Response Style |
|---|---|
| Simple question | Direct answer, ≤3 sentences |
| Bug fix | Why → atomic units → code → verify commands |
| Feature addition | Brainstorming first → plan → atomic units → code |
| Architecture question | Trade-off sentence → single recommendation → example |
| Code review | Per-file findings, severity-tagged, actionable |
