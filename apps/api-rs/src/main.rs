mod auth;
mod config;
mod db;
mod errors;
mod mcp;
mod models;
mod routes;
mod validation;

use axum::Router;
use http::Method;
use tower_http::cors::AllowHeaders;
use tower_http::cors::AllowMethods;
use tower_http::cors::AllowOrigin;
use tower_http::cors::CorsLayer;

use crate::auth::middleware::AppState;
use crate::config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let config = Config::from_env()?;
    let pool = db::create_pool(&config.database_url).await?;
    db::run_migrations(&pool).await?;

    let origins: Vec<_> = config
        .cors_origins
        .iter()
        .filter_map(|o| o.parse::<http::HeaderValue>().ok())
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods(AllowMethods::list([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ]))
        .allow_headers(AllowHeaders::list([
            http::header::AUTHORIZATION,
            http::header::CONTENT_TYPE,
        ]))
        .allow_credentials(true);

    let state = AppState {
        pool,
        config: config.clone(),
    };

    let app = Router::new()
        .merge(routes::router())
        .layer(cors)
        .with_state(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("api-rs listening on {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
