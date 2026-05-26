use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::Row;
use std::time::Duration;
use uuid::Uuid;

use crate::{
    auth::middleware::{AppState, AuthUser},
    errors::{AppError, AppResult},
};

pub fn router() -> Router<AppState> {
    Router::new().route("/api/v1/test-console/send", post(send_test_request))
}

#[derive(Debug, Deserialize)]
pub struct TestSendRequest {
    pub service_id: Uuid,
    pub skill_id: Option<String>,
    pub message: String,
    pub auth_profile: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TestSendResponse {
    pub task_id: String,
    pub status: String,
    pub messages: Vec<Value>,
    pub raw_request: Value,
    pub raw_response: Value,
}

async fn send_test_request(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<TestSendRequest>,
) -> AppResult<Json<TestSendResponse>> {
    let row = sqlx::query(
        r#"SELECT se.base_url, se.protocol_binding
           FROM service_endpoints se
           JOIN services s ON s.id = se.service_id
           WHERE s.id = $1 AND s.organization_id = $2
           ORDER BY se.is_preferred DESC LIMIT 1"#,
    )
    .bind(body.service_id)
    .bind(auth.org_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Service or endpoint not found".to_string()))?;

    let base_url = row
        .get::<Option<String>, _>("base_url")
        .ok_or_else(|| AppError::UnprocessableEntity("Endpoint has no base URL".to_string()))?;

    let task_id = format!("task_{}", &Uuid::new_v4().to_string()[..8]);

    let rpc_request = json!({
        "jsonrpc": "2.0",
        "id": &task_id,
        "method": "message/send",
        "params": {
            "message": { "role": "user", "parts": [{ "kind": "text", "text": body.message }] },
            "skill": body.skill_id,
        }
    });

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| AppError::Internal(anyhow::anyhow!("{e}")))?;

    let agent_response = client
        .post(&base_url)
        .json(&rpc_request)
        .send()
        .await
        .map_err(|e| AppError::UnprocessableEntity(format!("Agent unreachable: {e}")))?;

    let raw_response: Value = agent_response
        .json()
        .await
        .unwrap_or(json!({ "error": "non-JSON response" }));

    let messages = if let Some(history) = raw_response
        .pointer("/result/history")
        .and_then(|h| h.as_array())
    {
        history.clone()
    } else {
        vec![json!({ "role": "agent", "kind": "text", "text": raw_response.to_string() })]
    };

    Ok(Json(TestSendResponse {
        task_id,
        status: "completed".to_string(),
        messages,
        raw_request: rpc_request,
        raw_response,
    }))
}
