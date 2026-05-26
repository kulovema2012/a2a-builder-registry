use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::Row;
use std::time::Duration;
use uuid::Uuid;

use crate::{
    auth::middleware::{AppState, AuthUser},
    errors::{AppError, AppResult},
};

pub fn router() -> Router<AppState> {
    Router::new().route("/api/v1/services/import", post(import_from_url))
}

#[derive(Debug, Deserialize)]
pub struct ImportRequest {
    pub agent_card_url: String,
}

#[derive(Debug, Serialize)]
pub struct ImportResponse {
    pub service_id: Uuid,
    pub slug: String,
    pub message: String,
}

async fn import_from_url(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<ImportRequest>,
) -> AppResult<(StatusCode, Json<ImportResponse>)> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(state.config.agent_card_fetch_timeout))
        .build()
        .map_err(|e| AppError::Internal(anyhow::anyhow!("http client: {e}")))?;

    let card: Value = client
        .get(&body.agent_card_url)
        .send()
        .await
        .map_err(|e| AppError::UnprocessableEntity(format!("Cannot fetch agent card: {e}")))?
        .json()
        .await
        .map_err(|e| AppError::UnprocessableEntity(format!("Agent card is not valid JSON: {e}")))?;

    let name = card["name"]
        .as_str()
        .ok_or_else(|| AppError::UnprocessableEntity("Agent card missing 'name' field".to_string()))?;
    let description = card["description"].as_str().map(String::from);
    let slug = name.to_lowercase().replace(' ', "-");
    let version = card["version"].as_str().unwrap_or("1.0.0");

    let mut tx = state.pool.begin().await?;

    let svc_row = sqlx::query(
        r#"INSERT INTO services (organization_id, name, slug, description, version, owner_user_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id"#,
    )
    .bind(auth.org_id)
    .bind(name)
    .bind(&slug)
    .bind(&description)
    .bind(version)
    .bind(auth.user_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Conflict(format!("Service with slug '{slug}' already exists"))
        } else {
            AppError::Database(e)
        }
    })?;
    let service_id: Uuid = svc_row.get("id");

    let checksum = format!("{:x}", {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut h = DefaultHasher::new();
        card.to_string().hash(&mut h);
        h.finish()
    });

    let snap_row = sqlx::query(
        "INSERT INTO agent_card_snapshots (service_id, raw_json, normalized_json, checksum, fetched_at)
         VALUES ($1, $2, $2, $3, now()) RETURNING id",
    )
    .bind(service_id)
    .bind(&card)
    .bind(&checksum)
    .fetch_one(&mut *tx)
    .await?;
    let snapshot_id: Uuid = snap_row.get("id");

    sqlx::query(
        "UPDATE services SET current_snapshot_id = $1 WHERE id = $2",
    )
    .bind(snapshot_id)
    .bind(service_id)
    .execute(&mut *tx)
    .await?;

    if let Some(url) = card["url"].as_str() {
        sqlx::query(
            "INSERT INTO service_endpoints (service_id, agent_card_url, base_url) VALUES ($1, $2, $2)",
        )
        .bind(service_id)
        .bind(url)
        .execute(&mut *tx)
        .await?;
    }

    if let Some(skills) = card["skills"].as_array() {
        for skill in skills {
            let skill_name = skill["name"].as_str().unwrap_or("unknown");
            let skill_desc = skill["description"].as_str().map(String::from);
            sqlx::query(
                "INSERT INTO skills (service_id, external_skill_id, name, description) VALUES ($1, $2, $3, $4)",
            )
            .bind(service_id)
            .bind(skill["id"].as_str())
            .bind(skill_name)
            .bind(&skill_desc)
            .execute(&mut *tx)
            .await?;
        }
    }

    sqlx::query(
        "INSERT INTO registry_events (service_id, actor_id, event_type, metadata)
         VALUES ($1, $2, 'service.created', $3)",
    )
    .bind(service_id)
    .bind(auth.user_id)
    .bind(serde_json::json!({ "source": "import", "url": body.agent_card_url }))
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok((
        StatusCode::CREATED,
        Json(ImportResponse {
            service_id,
            slug,
            message: "Agent card imported successfully".to_string(),
        }),
    ))
}
