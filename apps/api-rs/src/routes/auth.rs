use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::State,
    http::{header, StatusCode},
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use chrono::{Duration, Utc};
use serde_json::json;

use crate::{
    auth::{
        jwt::{encode_access_token, generate_refresh_token, hash_refresh_token},
        middleware::AppState,
    },
    errors::{AppError, AppResult},
    models::user::{AuthResponse, LoginRequest, RegisterRequest, UserPublic},
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/v1/auth/register", post(register))
        .route("/api/v1/auth/login", post(login))
        .route("/api/v1/auth/refresh", post(refresh))
        .route("/api/v1/auth/logout", post(logout))
}

async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> AppResult<impl IntoResponse> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(body.password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("password hash failed: {e}")))?
        .to_string();

    let mut tx = state.pool.begin().await?;

    let org_slug = body.org_name.to_lowercase().replace(' ', "-");
    let org = sqlx::query!(
        "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug, plan, created_at",
        body.org_name,
        org_slug,
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Conflict(format!("Organization slug '{org_slug}' already exists"))
        } else {
            AppError::Database(e)
        }
    })?;

    let user = sqlx::query!(
        "INSERT INTO users (organization_id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'admin')
         RETURNING id, organization_id, name, email, password_hash, role, created_at",
        org.id,
        body.name,
        body.email,
        password_hash,
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Conflict(format!("Email '{}' already registered", body.email))
        } else {
            AppError::Database(e)
        }
    })?;

    tx.commit().await?;

    let access_token = encode_access_token(
        user.id,
        org.id,
        "admin",
        &state.config.jwt_secret,
        state.config.jwt_access_ttl,
    )
    .map_err(|e| AppError::Internal(e))?;

    let refresh_token = generate_refresh_token();
    let token_hash = hash_refresh_token(&refresh_token);
    let expires_at = Utc::now() + Duration::seconds(state.config.jwt_refresh_ttl);

    sqlx::query!(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        user.id,
        token_hash,
        expires_at,
    )
    .execute(&state.pool)
    .await?;

    let cookie = Cookie::build(("refresh_token", refresh_token))
        .http_only(true)
        .same_site(SameSite::Strict)
        .path("/api/v1/auth")
        .max_age(time::Duration::seconds(state.config.jwt_refresh_ttl))
        .build();

    let response = AuthResponse {
        access_token,
        token_type: "bearer".to_string(),
        user: UserPublic {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization_id: org.id,
        },
    };

    Ok((
        StatusCode::CREATED,
        [(header::SET_COOKIE, cookie.to_string())],
        Json(response),
    ))
}

async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> AppResult<impl IntoResponse> {
    let user = sqlx::query!(
        "SELECT id, organization_id, name, email, password_hash, role FROM users WHERE email = $1",
        body.email,
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("hash parse: {e}")))?;

    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid email or password".to_string()))?;

    let access_token = encode_access_token(
        user.id,
        user.organization_id,
        &user.role,
        &state.config.jwt_secret,
        state.config.jwt_access_ttl,
    )
    .map_err(|e| AppError::Internal(e))?;

    let refresh_token = generate_refresh_token();
    let token_hash = hash_refresh_token(&refresh_token);
    let expires_at = Utc::now() + Duration::seconds(state.config.jwt_refresh_ttl);

    sqlx::query!(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        user.id,
        token_hash,
        expires_at,
    )
    .execute(&state.pool)
    .await?;

    let cookie = Cookie::build(("refresh_token", refresh_token))
        .http_only(true)
        .same_site(SameSite::Strict)
        .path("/api/v1/auth")
        .max_age(time::Duration::seconds(state.config.jwt_refresh_ttl))
        .build();

    let response = AuthResponse {
        access_token,
        token_type: "bearer".to_string(),
        user: UserPublic {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization_id: user.organization_id,
        },
    };

    Ok((
        StatusCode::OK,
        [(header::SET_COOKIE, cookie.to_string())],
        Json(response),
    ))
}

async fn refresh(
    State(state): State<AppState>,
    jar: axum_extra::extract::CookieJar,
) -> AppResult<impl IntoResponse> {
    let refresh_token = jar
        .get("refresh_token")
        .map(|c| c.value().to_string())
        .ok_or_else(|| AppError::Unauthorized("No refresh token".to_string()))?;

    let token_hash = hash_refresh_token(&refresh_token);

    let stored = sqlx::query!(
        "SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1",
        token_hash,
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid refresh token".to_string()))?;

    if stored.revoked_at.is_some() {
        return Err(AppError::Unauthorized("Refresh token revoked".to_string()));
    }
    if stored.expires_at < Utc::now() {
        return Err(AppError::Unauthorized("Refresh token expired".to_string()));
    }

    sqlx::query!(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1",
        stored.id
    )
    .execute(&state.pool)
    .await?;

    let user = sqlx::query!(
        "SELECT id, organization_id, role FROM users WHERE id = $1",
        stored.user_id
    )
    .fetch_one(&state.pool)
    .await?;

    let access_token = encode_access_token(
        user.id,
        user.organization_id,
        &user.role,
        &state.config.jwt_secret,
        state.config.jwt_access_ttl,
    )
    .map_err(|e| AppError::Internal(e))?;

    let new_refresh = generate_refresh_token();
    let new_hash = hash_refresh_token(&new_refresh);
    let expires_at = Utc::now() + Duration::seconds(state.config.jwt_refresh_ttl);

    sqlx::query!(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        user.id,
        new_hash,
        expires_at,
    )
    .execute(&state.pool)
    .await?;

    let cookie = Cookie::build(("refresh_token", new_refresh))
        .http_only(true)
        .same_site(SameSite::Strict)
        .path("/api/v1/auth")
        .max_age(time::Duration::seconds(state.config.jwt_refresh_ttl))
        .build();

    Ok((
        [(header::SET_COOKIE, cookie.to_string())],
        Json(json!({ "access_token": access_token, "token_type": "bearer" })),
    ))
}

async fn logout(
    State(state): State<AppState>,
    jar: axum_extra::extract::CookieJar,
) -> AppResult<impl IntoResponse> {
    if let Some(cookie) = jar.get("refresh_token") {
        let hash = hash_refresh_token(cookie.value());
        sqlx::query!(
            "UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1",
            hash
        )
        .execute(&state.pool)
        .await?;
    }

    let removal = Cookie::build(("refresh_token", ""))
        .http_only(true)
        .path("/api/v1/auth")
        .max_age(time::Duration::seconds(0))
        .build();

    Ok((
        [(header::SET_COOKIE, removal.to_string())],
        Json(json!({ "message": "logged out" })),
    ))
}
