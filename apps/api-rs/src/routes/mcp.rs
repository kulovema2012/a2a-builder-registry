use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post},
    Json, Router,
};
use sqlx::Row;
use uuid::Uuid;

use crate::{
    auth::middleware::{AppState, AuthUser},
    errors::{AppError, AppResult},
    models::mcp::{CreateMcpConnectionRequest, McpConnectionRow},
    routes::services::ensure_service_belongs_to_org,
    validation::mcp_probe::probe_mcp_server,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/v1/services/:id/mcp-connections",
            get(list_mcp).post(add_mcp),
        )
        .route(
            "/api/v1/services/:id/mcp-connections/:conn_id",
            delete(delete_mcp),
        )
        .route(
            "/api/v1/services/:id/mcp-connections/:conn_id/verify",
            post(verify_mcp),
        )
}

async fn list_mcp(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(service_id): Path<Uuid>,
) -> AppResult<Json<Vec<McpConnectionRow>>> {
    ensure_service_belongs_to_org(&state.pool, service_id, auth.org_id).await?;
    let connections = sqlx::query_as::<_, McpConnectionRow>(
        r#"SELECT id, service_id, name, server_url, transport,
                  capabilities, auth_type, is_verified, verified_at, created_at
           FROM mcp_connections WHERE service_id = $1 ORDER BY created_at ASC"#,
    )
    .bind(service_id)
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(connections))
}

async fn add_mcp(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(service_id): Path<Uuid>,
    Json(body): Json<CreateMcpConnectionRequest>,
) -> AppResult<(StatusCode, Json<McpConnectionRow>)> {
    ensure_service_belongs_to_org(&state.pool, service_id, auth.org_id).await?;

    let valid_transports = ["http", "sse", "stdio"];
    if !valid_transports.contains(&body.transport.as_str()) {
        return Err(AppError::UnprocessableEntity(format!(
            "transport must be one of: {}",
            valid_transports.join(", ")
        )));
    }

    let caps = serde_json::to_value(body.capabilities.unwrap_or_default())
        .unwrap_or(serde_json::json!([]));

    let conn = sqlx::query_as::<_, McpConnectionRow>(
        r#"INSERT INTO mcp_connections (service_id, name, server_url, transport, capabilities, auth_type)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, service_id, name, server_url, transport,
                     capabilities, auth_type, is_verified, verified_at, created_at"#,
    )
    .bind(service_id)
    .bind(&body.name)
    .bind(&body.server_url)
    .bind(&body.transport)
    .bind(&caps)
    .bind(&body.auth_type)
    .fetch_one(&state.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(conn)))
}

async fn delete_mcp(
    State(state): State<AppState>,
    _auth: AuthUser,
    Path((service_id, conn_id)): Path<(Uuid, Uuid)>,
) -> AppResult<StatusCode> {
    sqlx::query(
        "DELETE FROM mcp_connections WHERE id = $1 AND service_id = $2",
    )
    .bind(conn_id)
    .bind(service_id)
    .execute(&state.pool)
    .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn verify_mcp(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((service_id, conn_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<McpConnectionRow>> {
    ensure_service_belongs_to_org(&state.pool, service_id, auth.org_id).await?;

    let conn_row = sqlx::query(
        "SELECT server_url, transport FROM mcp_connections WHERE id = $1 AND service_id = $2",
    )
    .bind(conn_id)
    .bind(service_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("MCP connection {conn_id} not found")))?;

    let server_url: String = conn_row.get("server_url");
    let transport: String = conn_row.get("transport");
    let verified = probe_mcp_server(&server_url, &transport, state.config.mcp_probe_timeout).await;

    let updated = sqlx::query_as::<_, McpConnectionRow>(
        r#"UPDATE mcp_connections
           SET is_verified = $2, verified_at = CASE WHEN $2 THEN now() ELSE NULL END
           WHERE id = $1
           RETURNING id, service_id, name, server_url, transport,
                     capabilities, auth_type, is_verified, verified_at, created_at"#,
    )
    .bind(conn_id)
    .bind(verified)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(updated))
}
