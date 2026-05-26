use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get, patch, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;
use uuid::Uuid;

use crate::{
    auth::middleware::{AppState, AuthUser},
    errors::{AppError, AppResult},
    models::service::*,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/v1/services", post(create_service).get(list_services))
        .route(
            "/api/v1/services/{id}",
            get(get_service)
                .patch(update_service)
                .delete(delete_service),
        )
        .route(
            "/api/v1/services/{id}/endpoints",
            get(list_endpoints).post(add_endpoint),
        )
        .route(
            "/api/v1/services/{id}/endpoints/{endpoint_id}",
            delete(delete_endpoint),
        )
        .route(
            "/api/v1/services/{id}/skills",
            get(list_skills).post(add_skill),
        )
        .route(
            "/api/v1/services/{id}/skills/{skill_id}",
            delete(delete_skill),
        )
        .route("/api/v1/services/{id}/validate", post(trigger_validation))
        .route(
            "/api/v1/services/{id}/validation-runs",
            get(list_validation_runs),
        )
        .route(
            "/api/v1/services/{id}/agent-card/generate",
            post(generate_agent_card),
        )
        .route("/api/v1/services/{id}/agent-card", get(get_agent_card))
}

// --- Column specs with enum/timestamp casts ---

const SVC_COLS: &str = r#"id, organization_id, name, slug, description, provider_name,
       provider_url, visibility::text as visibility, status::text as status,
       owner_user_id, current_snapshot_id, tags,
       icon_url, documentation_url, version,
       delegates_to, created_at::timestamptz as created_at, updated_at::timestamptz as updated_at"#;

const EP_COLS: &str = r#"id, service_id, agent_card_url, base_url,
       protocol_binding::text as protocol_binding, protocol_version,
       tenant, is_preferred, created_at::timestamptz as created_at"#;

const SKILL_COLS: &str = r#"id, service_id, external_skill_id, name, description,
       tags, input_modes, output_modes,
       examples, security_requirements, created_at::timestamptz as created_at"#;

// --- Row-to-JSON helpers ---

fn svc_json(r: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id": r.get::<Uuid, _>("id"),
        "organizationId": r.get::<Uuid, _>("organization_id"),
        "name": r.get::<String, _>("name"),
        "slug": r.get::<String, _>("slug"),
        "description": r.get::<Option<String>, _>("description"),
        "providerName": r.get::<Option<String>, _>("provider_name"),
        "providerUrl": r.get::<Option<String>, _>("provider_url"),
        "visibility": r.get::<Option<String>, _>("visibility"),
        "status": r.get::<Option<String>, _>("status"),
        "ownerUserId": r.get::<Option<Uuid>, _>("owner_user_id"),
        "currentSnapshotId": r.get::<Option<Uuid>, _>("current_snapshot_id"),
        "tags": r.get::<Option<Vec<String>>, _>("tags"),
        "iconUrl": r.get::<Option<String>, _>("icon_url"),
        "documentationUrl": r.get::<Option<String>, _>("documentation_url"),
        "version": r.get::<Option<String>, _>("version"),
        "delegatesTo": r.get::<Option<Vec<String>>, _>("delegates_to"),
        "createdAt": r.get::<Option<DateTime<Utc>>, _>("created_at"),
        "updatedAt": r.get::<Option<DateTime<Utc>>, _>("updated_at"),
    })
}

fn ep_json(r: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id": r.get::<Uuid, _>("id"),
        "serviceId": r.get::<Uuid, _>("service_id"),
        "agentCardUrl": r.get::<Option<String>, _>("agent_card_url"),
        "baseUrl": r.get::<Option<String>, _>("base_url"),
        "protocolBinding": r.get::<Option<String>, _>("protocol_binding"),
        "protocolVersion": r.get::<Option<String>, _>("protocol_version"),
        "tenant": r.get::<Option<String>, _>("tenant"),
        "isPreferred": r.get::<Option<bool>, _>("is_preferred"),
        "createdAt": r.get::<Option<DateTime<Utc>>, _>("created_at"),
    })
}

fn skill_json(r: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id": r.get::<Uuid, _>("id"),
        "serviceId": r.get::<Uuid, _>("service_id"),
        "externalSkillId": r.get::<Option<String>, _>("external_skill_id"),
        "name": r.get::<String, _>("name"),
        "description": r.get::<Option<String>, _>("description"),
        "tags": r.get::<Option<Vec<String>>, _>("tags"),
        "inputModes": r.get::<Option<Vec<String>>, _>("input_modes"),
        "outputModes": r.get::<Option<Vec<String>>, _>("output_modes"),
        "examples": r.get::<Option<Value>, _>("examples"),
        "securityRequirements": r.get::<Option<Value>, _>("security_requirements"),
        "createdAt": r.get::<Option<DateTime<Utc>>, _>("created_at"),
    })
}

// --- Service CRUD ---

async fn create_service(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CreateServiceRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let visibility = body.visibility.as_deref().unwrap_or("draft").to_lowercase();
    let tags = body.tags.unwrap_or_default();
    let delegates_to = body.delegates_to.unwrap_or_default();
    let version = body.version.unwrap_or_else(|| "1.0.0".to_string());

    let sql = format!(
        "INSERT INTO services (organization_id, name, slug, description, provider_name, provider_url,
                              visibility, tags, version, delegates_to, owner_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7::visibility, $8, $9, $10, $11)
         RETURNING {SVC_COLS}"
    );
    let row = sqlx::query(&sql)
        .bind(auth.org_id)
        .bind(&body.name)
        .bind(&body.slug)
        .bind(&body.description)
        .bind(&body.provider_name)
        .bind(&body.provider_url)
        .bind(visibility)
        .bind(&tags)
        .bind(&version)
        .bind(&delegates_to)
        .bind(auth.user_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            if e.to_string().contains("unique") {
                AppError::Conflict(format!("Service slug '{}' already exists", body.slug))
            } else {
                AppError::Database(e)
            }
        })?;

    let service_id: Uuid = row.get("id");
    let slug: String = row.get("slug");
    let name: String = row.get("name");

    sqlx::query(
        "INSERT INTO registry_events (service_id, actor_id, event_type, metadata) VALUES ($1, $2, 'service.created', $3)",
    )
    .bind(service_id)
    .bind(auth.user_id)
    .bind(json!({ "slug": slug, "name": name }))
    .execute(&state.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(svc_json(&row))))
}

async fn list_services(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<ServiceListParams>,
) -> AppResult<Json<Value>> {
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * 20;
    let q_pattern = params.q.as_ref().map(|q| format!("%{q}%"));

    let sql = format!(
        "SELECT {SVC_COLS} FROM services
         WHERE organization_id = $1
           AND ($2::text IS NULL OR name ILIKE $2 OR slug ILIKE $2)
           AND ($3::text IS NULL OR visibility::text = $3)
           AND ($4::text IS NULL OR status::text = $4)
         ORDER BY created_at DESC LIMIT 20 OFFSET $5"
    );
    let rows = sqlx::query(&sql)
        .bind(auth.org_id)
        .bind(&q_pattern)
        .bind(&params.visibility)
        .bind(&params.status)
        .bind(offset)
        .fetch_all(&state.pool)
        .await?;

    let services: Vec<Value> = rows.iter().map(svc_json).collect();
    Ok(Json(json!({ "services": services, "page": page })))
}

async fn get_service(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let sql = format!("SELECT {SVC_COLS} FROM services WHERE id = $1 AND organization_id = $2");
    let row = sqlx::query(&sql)
        .bind(id)
        .bind(auth.org_id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Service {id} not found")))?;

    Ok(Json(svc_json(&row)))
}

async fn update_service(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateServiceRequest>,
) -> AppResult<Json<Value>> {
    let sql = format!(
        "UPDATE services SET
             name = COALESCE($3, name),
             description = COALESCE($4, description),
             provider_name = COALESCE($5, provider_name),
             provider_url = COALESCE($6, provider_url),
             visibility = CASE WHEN $7 IS NOT NULL THEN $7::visibility ELSE visibility END,
             status = CASE WHEN $8 IS NOT NULL THEN $8::service_status ELSE status END,
             tags = COALESCE($9, tags),
             version = COALESCE($10, version),
             delegates_to = COALESCE($11, delegates_to),
             updated_at = now()
         WHERE id = $1 AND organization_id = $2
         RETURNING {SVC_COLS}"
    );
    let row = sqlx::query(&sql)
        .bind(id)
        .bind(auth.org_id)
        .bind(&body.name)
        .bind(&body.description)
        .bind(&body.provider_name)
        .bind(&body.provider_url)
        .bind(&body.visibility)
        .bind(&body.status)
        .bind(body.tags.as_deref())
        .bind(&body.version)
        .bind(body.delegates_to.as_deref())
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Service {id} not found")))?;

    Ok(Json(svc_json(&row)))
}

async fn delete_service(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query("DELETE FROM services WHERE id = $1 AND organization_id = $2")
        .bind(id)
        .bind(auth.org_id)
        .execute(&state.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Service {id} not found")));
    }
    Ok(StatusCode::NO_CONTENT)
}

// --- Endpoints ---

async fn list_endpoints(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    ensure_service_belongs_to_org(&state.pool, id, auth.org_id).await?;

    let sql = format!(
        "SELECT {EP_COLS} FROM service_endpoints WHERE service_id = $1 ORDER BY is_preferred DESC"
    );
    let rows = sqlx::query(&sql).bind(id).fetch_all(&state.pool).await?;
    let endpoints: Vec<Value> = rows.iter().map(ep_json).collect();
    Ok(Json(json!({ "endpoints": endpoints })))
}

async fn add_endpoint(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<CreateEndpointRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    ensure_service_belongs_to_org(&state.pool, id, auth.org_id).await?;
    let binding = body.protocol_binding.as_deref().unwrap_or("JSONRPC");
    let proto_ver = body.protocol_version.as_deref().unwrap_or("0.2");
    let preferred = body.is_preferred.unwrap_or(true);

    let sql = format!(
        "INSERT INTO service_endpoints (service_id, agent_card_url, base_url, protocol_binding, protocol_version, tenant, is_preferred)
         VALUES ($1, $2, $3, $4::protocol_binding, $5, $6, $7) RETURNING {EP_COLS}"
    );
    let row = sqlx::query(&sql)
        .bind(id)
        .bind(&body.agent_card_url)
        .bind(&body.base_url)
        .bind(binding)
        .bind(proto_ver)
        .bind(&body.tenant)
        .bind(preferred)
        .fetch_one(&state.pool)
        .await?;

    Ok((StatusCode::CREATED, Json(ep_json(&row))))
}

async fn delete_endpoint(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((service_id, endpoint_id)): Path<(Uuid, Uuid)>,
) -> AppResult<StatusCode> {
    ensure_service_belongs_to_org(&state.pool, service_id, auth.org_id).await?;
    sqlx::query("DELETE FROM service_endpoints WHERE id = $1 AND service_id = $2")
        .bind(endpoint_id)
        .bind(service_id)
        .execute(&state.pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

// --- Skills ---

async fn list_skills(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    ensure_service_belongs_to_org(&state.pool, id, auth.org_id).await?;

    let sql =
        format!("SELECT {SKILL_COLS} FROM skills WHERE service_id = $1 ORDER BY created_at ASC");
    let rows = sqlx::query(&sql).bind(id).fetch_all(&state.pool).await?;
    let skills: Vec<Value> = rows.iter().map(skill_json).collect();
    Ok(Json(json!({ "skills": skills })))
}

async fn add_skill(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<CreateSkillRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    ensure_service_belongs_to_org(&state.pool, id, auth.org_id).await?;
    let tags = body.tags.unwrap_or_default();
    let input_modes = body.input_modes.unwrap_or_default();
    let output_modes = body.output_modes.unwrap_or_default();

    let sql = format!(
        "INSERT INTO skills (service_id, external_skill_id, name, description, tags, input_modes, output_modes, examples)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING {SKILL_COLS}"
    );
    let row = sqlx::query(&sql)
        .bind(id)
        .bind(&body.external_skill_id)
        .bind(&body.name)
        .bind(&body.description)
        .bind(&tags)
        .bind(&input_modes)
        .bind(&output_modes)
        .bind(&body.examples)
        .fetch_one(&state.pool)
        .await?;

    Ok((StatusCode::CREATED, Json(skill_json(&row))))
}

async fn delete_skill(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((service_id, skill_id)): Path<(Uuid, Uuid)>,
) -> AppResult<StatusCode> {
    ensure_service_belongs_to_org(&state.pool, service_id, auth.org_id).await?;
    sqlx::query("DELETE FROM skills WHERE id = $1 AND service_id = $2")
        .bind(skill_id)
        .bind(service_id)
        .execute(&state.pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

// --- Validation + Agent Card ---

async fn trigger_validation(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    ensure_service_belongs_to_org(&state.pool, id, auth.org_id).await?;

    let svc_row =
        sqlx::query("SELECT name, slug, description, provider_url FROM services WHERE id = $1")
            .bind(id)
            .fetch_one(&state.pool)
            .await?;

    let ep_rows =
        sqlx::query("SELECT agent_card_url, base_url FROM service_endpoints WHERE service_id = $1")
            .bind(id)
            .fetch_all(&state.pool)
            .await?;

    let mcp_rows =
        sqlx::query("SELECT server_url, transport FROM mcp_connections WHERE service_id = $1")
            .bind(id)
            .fetch_all(&state.pool)
            .await?;

    let run_id = Uuid::new_v4();
    let started_at = Utc::now();

    sqlx::query(
        "INSERT INTO validation_runs (id, service_id, status, started_at) VALUES ($1, $2, 'running'::validation_status, $3)",
    )
    .bind(run_id)
    .bind(id)
    .bind(started_at)
    .execute(&state.pool)
    .await?;

    let service_name: String = svc_row.get("name");
    let service_desc: Option<String> = svc_row.get("description");
    let service_url: Option<String> = svc_row.get("provider_url");

    let endpoint_url: Option<String> = ep_rows
        .first()
        .and_then(|r| r.get::<Option<String>, _>("agent_card_url"));

    let mcp_urls: Vec<(String, String)> = mcp_rows
        .iter()
        .map(|r| {
            (
                r.get::<String, _>("server_url"),
                r.get::<String, _>("transport"),
            )
        })
        .collect();

    let pool = state.pool.clone();
    let config = state.config.clone();
    let actor_id = auth.user_id;
    tokio::spawn(async move {
        let engine =
            crate::validation::engine::ValidationEngine::new(config.agent_card_fetch_timeout);
        let card_data = json!({
            "name": service_name,
            "description": service_desc,
            "url": service_url,
        });
        let result = engine
            .validate(&card_data, endpoint_url.as_deref(), &mcp_urls)
            .await;

        let status = if result.checks.iter().any(|c| c.status == "failed") {
            "failed"
        } else if result.checks.iter().any(|c| c.status == "warning") {
            "warning"
        } else {
            "passed"
        };
        let checks_json = serde_json::to_value(&result.checks).unwrap_or_default();
        let errors_json = serde_json::to_value(
            result
                .checks
                .iter()
                .filter(|c| c.status == "failed")
                .collect::<Vec<_>>(),
        )
        .unwrap_or_default();
        let warnings_json = serde_json::to_value(
            result
                .checks
                .iter()
                .filter(|c| c.status == "warning")
                .collect::<Vec<_>>(),
        )
        .unwrap_or_default();

        let _ = sqlx::query(
            "UPDATE validation_runs SET status = $2::validation_status, score = $3,
             checks = $4, errors = $5, warnings = $6, finished_at = now() WHERE id = $1",
        )
        .bind(run_id)
        .bind(status)
        .bind(result.score)
        .bind(checks_json)
        .bind(errors_json)
        .bind(warnings_json)
        .execute(&pool)
        .await;

        let event_type = if status == "passed" {
            "validation.passed"
        } else {
            "validation.failed"
        };
        let _ = sqlx::query(
            "INSERT INTO registry_events (service_id, actor_id, event_type, metadata) VALUES ($1, $2, $3, $4)",
        )
        .bind(id)
        .bind(actor_id)
        .bind(event_type)
        .bind(json!({ "run_id": run_id, "score": result.score, "status": status }))
        .execute(&pool)
        .await;
    });

    Ok(Json(
        json!({ "run_id": run_id, "status": "running", "message": "Validation started" }),
    ))
}

async fn list_validation_runs(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    ensure_service_belongs_to_org(&state.pool, id, auth.org_id).await?;

    let rows = sqlx::query(
        r#"SELECT id, service_id, status::text as status, score, checks, errors, warnings,
                  response_time_ms, started_at::timestamptz as started_at,
                  finished_at::timestamptz as finished_at, created_at::timestamptz as created_at
           FROM validation_runs WHERE service_id = $1 ORDER BY created_at DESC LIMIT 20"#,
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let runs: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<Uuid, _>("id"),
                "serviceId": r.get::<Uuid, _>("service_id"),
                "status": r.get::<Option<String>, _>("status"),
                "score": r.get::<Option<i32>, _>("score"),
                "checks": r.get::<Option<Value>, _>("checks"),
                "errors": r.get::<Option<Value>, _>("errors"),
                "warnings": r.get::<Option<Value>, _>("warnings"),
                "responseTimeMs": r.get::<Option<i32>, _>("response_time_ms"),
                "startedAt": r.get::<Option<DateTime<Utc>>, _>("started_at"),
                "finishedAt": r.get::<Option<DateTime<Utc>>, _>("finished_at"),
                "createdAt": r.get::<Option<DateTime<Utc>>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "runs": runs })))
}

async fn generate_agent_card(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let svc_sql = format!("SELECT {SVC_COLS} FROM services WHERE id = $1 AND organization_id = $2");
    let svc_row = sqlx::query(&svc_sql)
        .bind(id)
        .bind(auth.org_id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Service {id} not found")))?;

    let ep_sql = format!("SELECT {EP_COLS} FROM service_endpoints WHERE service_id = $1");
    let ep_rows = sqlx::query(&ep_sql).bind(id).fetch_all(&state.pool).await?;

    let skill_sql = format!("SELECT {SKILL_COLS} FROM skills WHERE service_id = $1");
    let skill_rows = sqlx::query(&skill_sql)
        .bind(id)
        .fetch_all(&state.pool)
        .await?;

    let mcp_rows = sqlx::query(
        "SELECT name, server_url, transport, capabilities, auth_type FROM mcp_connections WHERE service_id = $1 AND is_verified = TRUE",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    let base_url = ep_rows
        .first()
        .and_then(|r| r.get::<Option<String>, _>("base_url"));

    let card = json!({
        "name": svc_row.get::<String, _>("name"),
        "description": svc_row.get::<Option<String>, _>("description"),
        "url": base_url,
        "version": svc_row.get::<Option<String>, _>("version"),
        "provider": {
            "organization": svc_row.get::<Option<String>, _>("provider_name"),
            "url": svc_row.get::<Option<String>, _>("provider_url"),
        },
        "capabilities": { "streaming": false, "pushNotifications": false },
        "skills": skill_rows.iter().map(|s| {
            let ext_id: Option<String> = s.get("external_skill_id");
            let sid: Uuid = s.get("id");
            json!({
                "id": ext_id.unwrap_or_else(|| sid.to_string()),
                "name": s.get::<String, _>("name"),
                "description": s.get::<Option<String>, _>("description"),
                "tags": s.get::<Option<Vec<String>>, _>("tags"),
                "inputModes": s.get::<Option<Vec<String>>, _>("input_modes"),
                "outputModes": s.get::<Option<Vec<String>>, _>("output_modes"),
                "examples": s.get::<Option<Value>, _>("examples"),
            })
        }).collect::<Vec<_>>(),
        "mcpServers": mcp_rows.iter().map(|m| json!({
            "name": m.get::<String, _>("name"),
            "url": m.get::<String, _>("server_url"),
            "transport": m.get::<String, _>("transport"),
            "capabilities": m.get::<Option<Value>, _>("capabilities"),
            "authType": m.get::<Option<String>, _>("auth_type"),
        })).collect::<Vec<_>>(),
        "delegatesTo": svc_row.get::<Option<Vec<String>>, _>("delegates_to"),
    });

    let checksum = format!("{:x}", {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut h = DefaultHasher::new();
        card.to_string().hash(&mut h);
        h.finish()
    });

    let snap_row = sqlx::query(
        "INSERT INTO agent_card_snapshots (service_id, raw_json, normalized_json, schema_version, checksum) VALUES ($1, $2, $2, '0.2', $3) RETURNING id",
    )
    .bind(id)
    .bind(&card)
    .bind(&checksum)
    .fetch_one(&state.pool)
    .await?;

    let snap_id: Uuid = snap_row.get("id");

    sqlx::query("UPDATE services SET current_snapshot_id = $1, updated_at = now() WHERE id = $2")
        .bind(snap_id)
        .bind(id)
        .execute(&state.pool)
        .await?;

    Ok(Json(card))
}

async fn get_agent_card(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    ensure_service_belongs_to_org(&state.pool, id, auth.org_id).await?;

    let row = sqlx::query(
        "SELECT normalized_json FROM agent_card_snapshots WHERE service_id = $1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("No agent card generated yet".to_string()))?;

    let card: Option<Value> = row.get("normalized_json");
    Ok(Json(card.unwrap_or(json!({}))))
}

// --- Org-scope helpers ---

pub async fn ensure_service_belongs_to_org(
    pool: &sqlx::PgPool,
    service_id: Uuid,
    org_id: Uuid,
) -> AppResult<()> {
    let row =
        sqlx::query("SELECT 1 as exists_flag FROM services WHERE id = $1 AND organization_id = $2")
            .bind(service_id)
            .bind(org_id)
            .fetch_optional(pool)
            .await?;

    if row.is_none() {
        return Err(AppError::NotFound(format!(
            "Service {service_id} not found"
        )));
    }
    Ok(())
}
