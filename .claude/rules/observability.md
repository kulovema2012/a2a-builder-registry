---
name: observability
description: No raw println! in production. Structured JSON tracing, contextual IDs (requestId, serviceId, traceId). Monitoring stack: Loki + Grafana + Tempo + Prometheus.
type: rule
---

# Observability — Structured Tracing & Monitoring

## Hard Rule: No Raw Output in Production

```rust
// ❌ Never
println!("Validating service {}", service_id);
println!("{:?}", card_data);  // PII / secret risk — card may contain securitySchemes

// ✅ Always
tracing::info!(
    service_id = %service_id,
    request_id = %request_id,
    fetch_endpoint = fetch_endpoint,
    "validation.started"
);
```

```typescript
// ❌ Never
console.log('fetching service', serviceId)
console.error(error)

// ✅ Always
logger.error('api.fetch_failed', {
  path: '/services',
  serviceId,
  error: error instanceof Error ? error.message : String(error),
  requestId,
})
```

## Structured Log Format (JSON)

Every log entry must include at minimum:

```json
{
  "level": "INFO",
  "message": "validation.finished",
  "timestamp": "2025-05-25T10:32:14.123Z",
  "service_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "validation_status": "passed",
  "score": 87,
  "response_time_ms": 312,
  "trace_id": "req-abc123"
}
```

**Never** include full `raw_json` / `normalized_json` from `AgentCardSnapshot` in logs — these may contain `securitySchemes` with token values.

## Log Levels

| Level | When | Example in this project |
|---|---|---|
| `error` | Unexpected failure needing investigation | `reqwest` HTTP error, DB connection lost |
| `warn` | Recoverable / degraded | Endpoint timeout on `check_endpoint_reachability`, HTTP (not HTTPS) URL |
| `info` | Key business events | `service.created`, `validation_run.started`, `approval.approved` |
| `debug` | Developer diagnostics — stripped in production | Pagination query parameters, check scores |

## Rust Tracing Setup

```rust
// apps/api-rs/src/main.rs
use tracing_subscriber::{fmt, EnvFilter};

fn init_tracing() {
    tracing_subscriber::fmt()
        .json()                              // Structured JSON output
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .with_target(true)
        .with_thread_ids(true)
        .init();
}
```

Usage across API layers:

```rust
// apps/api-rs/src/validation/engine.rs
use tracing::{info, warn, error, instrument};

#[instrument(skip(card_data), fields(service_id = %service_id))]
pub async fn validate_card(card_data: &serde_json::Value, service_id: Uuid) -> ValidationResult {
    info!("validation.started");

    // ... validation logic ...

    info!(
        score = result.score,
        status = %result.status,
        "validation.finished"
    );
    result
}
```

## Where to Log

```
✅ apps/api-rs/src/routes/services.rs           — entry/exit of create_service, list_services
✅ apps/api-rs/src/validation/engine.rs         — start/finish of validate_card()
✅ apps/api-rs/src/routes/import.rs             — import errors, fetch failures
✅ apps/api-rs/src/db.rs                        — connection pool errors
✅ apps/api-rs/src/auth/jwt.rs                  — token validation failures

❌ Inside check_required_fields() loop          — too noisy
❌ apps/api-rs/src/routes/mod.rs                — middleware logs every request
❌ Full AgentCard JSON                          — PII/secret risk
```

## RegistryEvent for Business Audit Trail

The `registry_events` table in Postgres provides an application-level audit trail separate from system logs. Always emit events for state changes:

```rust
sqlx::query!(
    r#"INSERT INTO registry_events (service_id, actor_id, event_type, metadata)
       VALUES ($1, $2, $3, $4)"#,
    service_id,
    current_user_id,   // from JWT in auth middleware
    "validation.passed",
    serde_json::json!({
        "score": result.score,
        "checks_passed": result.checks.iter().filter(|c| c.status == "passed").count(),
    }),
)
.execute(pool)
.await?;
```

Use `event_type` values: `service.created`, `service.updated`, `service.deleted`, `validation.passed`, `validation.failed`, `approval.approved`, `approval.rejected`.

## Production Monitoring Stack

| Tool | Role | Collects From |
|---|---|---|
| **Loki** | Log aggregation | Docker log driver, structured JSON from tracing-subscriber |
| **Grafana** | Dashboards & alerts | Loki, Prometheus, Tempo |
| **Tempo** | Distributed tracing | OpenTelemetry SDK via tracing-opentelemetry |
| **Prometheus** | Metrics | Axum `/metrics` via metrics-exporter-prometheus |

Key metrics to track: `http_request_duration_seconds`, `validation_run_duration_ms`, `agent_card_fetch_errors_total`, `approval_queue_depth`.
