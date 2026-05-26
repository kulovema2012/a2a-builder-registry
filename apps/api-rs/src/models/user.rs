use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
#[allow(dead_code)]
pub struct User {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub plan: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    pub org_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub token_type: String,
    pub user: UserPublic,
}

#[derive(Debug, Serialize)]
pub struct UserPublic {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: String,
    pub organization_id: Uuid,
}

impl From<User> for UserPublic {
    fn from(u: User) -> Self {
        UserPublic {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            organization_id: u.organization_id,
        }
    }
}
