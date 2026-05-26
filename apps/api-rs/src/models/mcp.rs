use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct McpConnectionRow {
    pub id: Uuid,
    pub service_id: Uuid,
    pub name: String,
    pub server_url: String,
    pub transport: String,
    pub capabilities: Value,
    pub auth_type: Option<String>,
    pub is_verified: bool,
    pub verified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMcpConnectionRequest {
    pub name: String,
    pub server_url: String,
    pub transport: String,
    pub capabilities: Option<Vec<String>>,
    pub auth_type: Option<String>,
}
