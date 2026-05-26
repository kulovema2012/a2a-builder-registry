---
name: testing
description: TDD-first with Arrange-Act-Assert for every unit of business logic. Real examples from Service, ValidationRun, AgentCardValidator.
type: rule
---

# Testing Standards — TDD + AAA

## Golden Rule

Write the failing test **before** the implementation. Every piece of business logic has a co-located unit test.

```
Red → Green → Refactor → Commit
```

## AAA Structure (Mandatory)

Every test must have three explicit sections with inline comments:

```rust
// Rust — #[tokio::test] + sqlx::test
#[tokio::test]
async fn test_validate_card_fails_on_missing_name() {
    // Arrange
    let validator = AgentCardValidator::new(5);
    let card = serde_json::json!({
        "description": "My agent",
        "url": "https://example.com"
        // missing 'name'
    });

    // Act
    let result = validator.validate_card(&card, false).await;

    // Assert
    assert_eq!(result.status, "failed");
    assert!(result.errors.iter().any(|e| e.field == "name"));
}
```

```typescript
// TypeScript — Vitest
import { describe, it, expect } from 'vitest'

describe('apiFetch', () => {
  it('throws with detail message on non-ok response', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 422,
      json: async () => ({ detail: 'Validation error' }),
    } as Response)

    // Act & Assert
    await expect(apiFetch('/services')).rejects.toThrow('Validation error')
  })
})
```

## When to Write Tests

| Layer | Required? | Example in this project |
|---|---|---|
| Business logic / domain | ✅ Always | `validation::engine::check_skills()` |
| API handlers | ✅ Always | `POST /api/v1/services` — test 409 on duplicate slug |
| Service functions | ✅ Always | `normalize_agent_card()`, `compute_checksum()` |
| Serde models | ✅ Always | `ServiceCreate` deserialization boundaries |
| Utility functions | ✅ Always | `find_sensitive_keys()` recursive traversal |
| React components with logic | ⚠️ Should | Pages that call `api.validateService()` |
| Pure presentational RSC | ❌ Optional | Static layout components |
| SDK wrappers | ❌ Skip | `reqwest::Client` usage |

## Test Commands

```bash
# Rust (from apps/api-rs/)
cargo test                                    # All tests
cargo test test_validate                      # Filter by name
cargo test -- --nocapture                     # Show println! output

# TypeScript (in apps/web)
bun test
bun test --watch
bunx playwright test                                     # E2E
```

## Test File Location

Co-locate tests in the same module using `#[cfg(test)] mod tests`:

```
apps/api-rs/src/
├── validation/
│   ├── engine.rs
│   │   └── #[cfg(test)] mod tests { ... }   ← co-located
│   └── mcp_probe.rs
├── models/
│   ├── service.rs
│   │   └── #[cfg(test)] mod tests { ... }   ← co-located
│   └── user.rs
├── config.rs
│   └── #[cfg(test)] mod tests { ... }       ← co-located
apps/web/
└── src/
    └── lib/
        ├── helpers.ts
        └── helpers.test.ts                    ← co-located
```

## Mocking Rules

- Mock external dependencies: PostgreSQL (`sqlx::test` with test DB), `reqwest` via test clients
- Use real implementations for pure functions: `compute_checksum`, `normalize_agent_card`
- Use `axum-test` crate for integration tests against route handlers

```rust
// Integration test with axum-test
use axum_test::TestServer;

#[tokio::test]
async fn test_create_service_rejects_duplicate_slug() {
    // Arrange
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    // Create first service
    server.post("/api/v1/services")
        .json(&json!({"name": "X", "slug": "my-agent"}))
        .await;

    // Act — try duplicate slug
    let resp = server.post("/api/v1/services")
        .json(&json!({"name": "Y", "slug": "my-agent"}))
        .await;

    // Assert
    assert_eq!(resp.status_code(), 409);
}
```

## Feature Addition Test Order

Serde model validation → Service/domain function → Route handler → Integration → UI (optional)
