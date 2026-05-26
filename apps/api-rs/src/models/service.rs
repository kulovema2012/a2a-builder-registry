use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, Serialize, Deserialize)]
pub struct Service {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub provider_name: Option<String>,
    pub provider_url: Option<String>,
    pub visibility: Option<String>,
    pub status: Option<String>,
    pub owner_user_id: Option<Uuid>,
    pub current_snapshot_id: Option<Uuid>,
    pub tags: Option<Vec<String>>,
    pub icon_url: Option<String>,
    pub documentation_url: Option<String>,
    pub version: Option<String>,
    pub delegates_to: Option<Vec<String>>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow, Serialize, Deserialize)]
pub struct ServiceEndpoint {
    pub id: Uuid,
    pub service_id: Uuid,
    pub agent_card_url: Option<String>,
    pub base_url: Option<String>,
    pub protocol_binding: Option<String>,
    pub protocol_version: Option<String>,
    pub tenant: Option<String>,
    pub is_preferred: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow, Serialize, Deserialize)]
pub struct Skill {
    pub id: Uuid,
    pub service_id: Uuid,
    pub external_skill_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub input_modes: Option<Vec<String>>,
    pub output_modes: Option<Vec<String>>,
    pub examples: Option<Value>,
    pub security_requirements: Option<Value>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct AgentCardSnapshot {
    pub id: Uuid,
    pub service_id: Uuid,
    pub raw_json: Option<Value>,
    pub normalized_json: Option<Value>,
    pub schema_version: Option<String>,
    pub checksum: Option<String>,
    pub fetched_at: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateServiceRequest {
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub provider_name: Option<String>,
    pub provider_url: Option<String>,
    pub visibility: Option<String>,
    pub tags: Option<Vec<String>>,
    pub version: Option<String>,
    pub delegates_to: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateServiceRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub provider_name: Option<String>,
    pub provider_url: Option<String>,
    pub visibility: Option<String>,
    pub status: Option<String>,
    pub tags: Option<Vec<String>>,
    pub version: Option<String>,
    pub delegates_to: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEndpointRequest {
    pub agent_card_url: Option<String>,
    pub base_url: Option<String>,
    pub protocol_binding: Option<String>,
    pub protocol_version: Option<String>,
    pub tenant: Option<String>,
    pub is_preferred: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSkillRequest {
    pub external_skill_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub input_modes: Option<Vec<String>>,
    pub output_modes: Option<Vec<String>>,
    pub examples: Option<Value>,
}

#[derive(Debug, Deserialize, Default)]
#[allow(dead_code)]
pub struct ServiceListParams {
    pub q: Option<String>,
    pub visibility: Option<String>,
    pub status: Option<String>,
    pub tags: Option<String>,
    pub mcp: Option<String>,
    pub page: Option<i64>,
}
