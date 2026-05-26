use axum::{
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use uuid::Uuid;

use crate::{auth::jwt::decode_token, config::Config, errors::AppError};

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub org_id: Uuid,
    pub role: String,
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub config: Config,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AppError::Unauthorized("Missing or malformed Bearer token".to_string()))?;

        let claims = decode_token(bearer.token(), &app_state.config.jwt_secret)
            .map_err(|_| AppError::Unauthorized("Invalid or expired token".to_string()))?;

        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("Invalid user ID in token".to_string()))?;
        let org_id = Uuid::parse_str(&claims.org)
            .map_err(|_| AppError::Unauthorized("Invalid org ID in token".to_string()))?;

        Ok(AuthUser {
            user_id,
            org_id,
            role: claims.role,
        })
    }
}
