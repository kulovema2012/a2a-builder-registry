use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;
use uuid::Uuid;

use crate::{
    auth::middleware::{AppState, AuthUser},
    errors::{AppError, AppResult},
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/v1/registry/agents", get(list_agents))
        .route("/api/v1/registry/agents/{id}", get(get_agent))
        .route(
            "/api/v1/registry/services/{id}/publish-request",
            post(publish_request),
        )
        .route("/api/v1/registry/events", get(list_events))
}

#[derive(Deserialize, Default)]
pub struct RegistryListParams {
    pub q: Option<String>,
    pub tags: Option<String>,
    pub mcp: Option<String>,
    pub skill: Option<String>,
    pub page: Option<i64>,
}

async fn list_agents(
    State(state): State<AppState>,
    Query(params): Query<RegistryListParams>,
) -> AppResult<Json<Value>> {
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * 20;
    let q_pattern = params.q.as_ref().map(|q| format!("%{q}%"));
    let mcp_pattern = params.mcp.as_ref().map(|m| format!("%{m}%"));

    let rows = sqlx::query(
        r#"SELECT s.id, s.name, s.slug, s.description, s.provider_name, s.provider_url,
                  s.tags, s.version, s.delegates_to,
                  s.created_at::timestamptz as created_at,
                  snap.normalized_json as agent_card
           FROM services s
           LEFT JOIN agent_card_snapshots snap ON snap.id = s.current_snapshot_id
           WHERE s.visibility = 'public' AND s.status = 'active'
             AND ($1::text IS NULL OR s.name ILIKE $1 OR s.slug ILIKE $1 OR s.description ILIKE $1)
             AND ($2::text IS NULL OR EXISTS (
                   SELECT 1 FROM mcp_connections m WHERE m.service_id = s.id AND m.name ILIKE $2
                 ))
           ORDER BY s.created_at DESC
           LIMIT 20 OFFSET $3"#,
    )
    .bind(&q_pattern)
    .bind(&mcp_pattern)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    let result: Vec<Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.get::<Uuid, _>("id"),
                "name": row.get::<String, _>("name"),
                "slug": row.get::<String, _>("slug"),
                "description": row.get::<Option<String>, _>("description"),
                "provider": {
                    "organization": row.get::<Option<String>, _>("provider_name"),
                    "url": row.get::<Option<String>, _>("provider_url"),
                },
                "tags": row.get::<Option<Vec<String>>, _>("tags"),
                "version": row.get::<Option<String>, _>("version"),
                "delegatesTo": row.get::<Option<Vec<String>>, _>("delegates_to"),
                "agentCard": row.get::<Option<serde_json::Value>, _>("agent_card"),
                "createdAt": row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "agents": result, "page": page })))
}

async fn get_agent(State(state): State<AppState>, Path(id): Path<Uuid>) -> AppResult<Json<Value>> {
    let row = sqlx::query(
        r#"SELECT s.id, s.name, s.slug, s.description, s.provider_name, s.provider_url,
                  s.tags, s.version, s.delegates_to,
                  s.created_at::timestamptz as created_at, snap.normalized_json as agent_card
           FROM services s
           LEFT JOIN agent_card_snapshots snap ON snap.id = s.current_snapshot_id
           WHERE s.id = $1 AND s.visibility = 'public'"#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Agent {id} not found")))?;

    Ok(Json(json!({
        "id": row.get::<Uuid, _>("id"),
        "name": row.get::<String, _>("name"),
        "slug": row.get::<String, _>("slug"),
        "description": row.get::<Option<String>, _>("description"),
        "provider": {
            "organization": row.get::<Option<String>, _>("provider_name"),
            "url": row.get::<Option<String>, _>("provider_url"),
        },
        "tags": row.get::<Option<Vec<String>>, _>("tags"),
        "version": row.get::<Option<String>, _>("version"),
        "delegatesTo": row.get::<Option<Vec<String>>, _>("delegates_to"),
        "agentCard": row.get::<Option<serde_json::Value>, _>("agent_card"),
        "createdAt": row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("created_at"),
    })))
}

async fn publish_request(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<(StatusCode, Json<Value>)> {
    let row = sqlx::query(
        "INSERT INTO approval_requests (service_id, requested_by) VALUES ($1, $2) RETURNING id",
    )
    .bind(id)
    .bind(auth.user_id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Conflict("Publish request already pending".to_string())
        } else {
            AppError::Database(e)
        }
    })?;

    sqlx::query(
        "UPDATE services SET status = 'pending_review'::service_status, updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(&state.pool)
    .await?;

    let req_id: Uuid = row.get("id");
    Ok((
        StatusCode::CREATED,
        Json(json!({ "id": req_id, "status": "pending" })),
    ))
}

#[derive(Deserialize, Default)]
pub struct EventListParams {
    pub service_id: Option<Uuid>,
    pub event_type: Option<String>,
    pub page: Option<i64>,
}

async fn list_events(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<EventListParams>,
) -> AppResult<Json<Value>> {
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * 50;

    let rows = sqlx::query(
        r#"SELECT e.id, e.service_id, e.actor_id, e.event_type, e.metadata,
                  e.created_at::timestamptz as created_at,
                  s.name as service_name, s.slug as service_slug
           FROM registry_events e
           LEFT JOIN services s ON s.id = e.service_id
           WHERE (s.organization_id = $1 OR e.service_id IS NULL)
             AND ($2::uuid IS NULL OR e.service_id = $2)
             AND ($3::text IS NULL OR e.event_type = $3)
           ORDER BY e.created_at DESC
           LIMIT 50 OFFSET $4"#,
    )
    .bind(auth.org_id)
    .bind(params.service_id)
    .bind(&params.event_type)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    let result: Vec<Value> = rows
        .iter()
        .map(|row| {
            json!({
                "id": row.get::<Uuid, _>("id"),
                "serviceId": row.get::<Option<Uuid>, _>("service_id"),
                "serviceName": row.get::<Option<String>, _>("service_name"),
                "serviceSlug": row.get::<Option<String>, _>("service_slug"),
                "actorId": row.get::<Option<Uuid>, _>("actor_id"),
                "eventType": row.get::<String, _>("event_type"),
                "metadata": row.get::<serde_json::Value, _>("metadata"),
                "createdAt": row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "events": result, "page": page })))
}
