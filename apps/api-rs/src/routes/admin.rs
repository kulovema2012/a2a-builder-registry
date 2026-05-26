use axum::{
    extract::{Path, Query, State},
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
        .route("/api/v1/admin/services/{id}/approve", post(approve_service))
        .route("/api/v1/admin/services/{id}/suspend", post(suspend_service))
        .route("/api/v1/admin/services", get(list_pending))
}

fn require_admin(auth: &AuthUser) -> AppResult<()> {
    if auth.role != "admin" {
        return Err(AppError::Forbidden);
    }
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct ApproveRequest {
    pub notes: Option<String>,
    pub action: String,
}

#[derive(Debug, Deserialize)]
pub struct AdminListParams {
    pub status: Option<String>,
    pub page: Option<i64>,
}

async fn list_pending(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<AdminListParams>,
) -> AppResult<Json<Value>> {
    require_admin(&auth)?;
    let status = params.status.as_deref().unwrap_or("pending_review");
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * 20;

    let rows = sqlx::query(
        r#"SELECT s.id, s.name, s.slug, s.status::text as status,
                  s.created_at::timestamptz as created_at,
                  ar.id as approval_id, ar.status::text as approval_status,
                  ar.created_at::timestamptz as requested_at
           FROM services s
           LEFT JOIN approval_requests ar ON ar.service_id = s.id AND ar.status = 'pending'
           WHERE s.status::text = $1
           ORDER BY s.created_at DESC
           LIMIT 20 OFFSET $2"#,
    )
    .bind(status)
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
                "status": row.get::<Option<String>, _>("status"),
                "approvalId": row.get::<Option<Uuid>, _>("approval_id"),
                "approvalStatus": row.get::<Option<String>, _>("approval_status"),
                "requestedAt": row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("requested_at"),
                "createdAt": row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "services": result, "page": page })))
}

async fn approve_service(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<ApproveRequest>,
) -> AppResult<Json<Value>> {
    require_admin(&auth)?;

    let (new_visibility, new_status, approval_status) = match body.action.as_str() {
        "approve" => ("public", "active", "approved"),
        "reject" => ("draft", "active", "rejected"),
        _ => return Err(AppError::UnprocessableEntity("action must be 'approve' or 'reject'".to_string())),
    };

    sqlx::query(
        "UPDATE services SET status = $2::service_status, visibility = $3::visibility, updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .bind(new_status)
    .bind(new_visibility)
    .execute(&state.pool)
    .await?;

    sqlx::query(
        "UPDATE approval_requests SET status = $2::approval_status, reviewed_by = $3,
         notes = $4, reviewed_at = now() WHERE service_id = $1 AND status = 'pending'",
    )
    .bind(id)
    .bind(approval_status)
    .bind(auth.user_id)
    .bind(&body.notes)
    .execute(&state.pool)
    .await?;

    let event_type = if body.action == "approve" { "approval.approved" } else { "approval.rejected" };
    sqlx::query(
        "INSERT INTO registry_events (service_id, actor_id, event_type, metadata)
         VALUES ($1, $2, $3, $4)",
    )
    .bind(id)
    .bind(auth.user_id)
    .bind(event_type)
    .bind(json!({ "action": body.action, "notes": body.notes }))
    .execute(&state.pool)
    .await?;

    Ok(Json(json!({ "service_id": id, "action": body.action, "status": new_visibility })))
}

async fn suspend_service(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    require_admin(&auth)?;

    sqlx::query(
        "UPDATE services SET status = 'suspended'::service_status, updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(&state.pool)
    .await?;

    sqlx::query(
        "INSERT INTO registry_events (service_id, actor_id, event_type, metadata)
         VALUES ($1, $2, 'service.suspended', '{}'::jsonb)",
    )
    .bind(id)
    .bind(auth.user_id)
    .execute(&state.pool)
    .await?;

    Ok(Json(json!({ "service_id": id, "status": "suspended" })))
}
