pub mod health;
pub mod auth;
pub mod services;
pub mod mcp;
pub mod registry;
pub mod import;
pub mod console;
pub mod admin;

use axum::Router;
use crate::auth::middleware::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .merge(health::router())
        .merge(auth::router())
        .merge(services::router())
        .merge(mcp::router())
        .merge(registry::router())
        .merge(import::router())
        .merge(console::router())
        .merge(admin::router())
}
