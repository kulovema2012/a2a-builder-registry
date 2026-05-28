use axum::{Json, Router};
use serde_json::{json, Value};

pub fn router() -> Router<crate::auth::middleware::AppState> {
    Router::new().route("/health", axum::routing::get(health_check))
}

async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok", "service": "api-rs" }))
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_health_returns_200() {
        let app = super::router().with_state(crate::auth::middleware::AppState {
            pool: sqlx::PgPool::connect_lazy("postgresql://x@localhost/x").unwrap(),
            config: crate::config::Config {
                database_url: "postgresql://x".to_string(),
                jwt_secret: "test-secret-32-chars-minimum-ok!!".to_string(),
                jwt_access_ttl: 900,
                jwt_refresh_ttl: 604800,
                cors_origins: vec![],
                agent_card_fetch_timeout: 10,
                mcp_probe_timeout: 5,
                port: 8000,
                openrouter_api_key: String::new(),
                openrouter_base_url: "https://openrouter.ai/api/v1".to_string(),
                openrouter_model: "anthropic/claude-haiku-4-5".to_string(),
            },
        });
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
