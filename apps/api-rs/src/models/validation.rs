use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct ValidationRun {
    pub id: Uuid,
    pub service_id: Uuid,
    pub status: String,
    pub score: Option<i32>,
    pub checks: Value,
    pub errors: Value,
    pub warnings: Value,
    pub response_time_ms: Option<i32>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct RegistryEvent {
    pub id: Uuid,
    pub service_id: Option<Uuid>,
    pub actor_id: Option<Uuid>,
    pub event_type: String,
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Default)]
#[allow(dead_code)]
pub struct EventListParams {
    pub service_id: Option<Uuid>,
    pub event_type: Option<String>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct ValidationCheck {
    pub name: String,
    pub status: String,
    pub message: String,
    pub level: String,
}

#[derive(Debug)]
pub struct ValidationResult {
    pub checks: Vec<ValidationCheck>,
    pub score: i32,
}
