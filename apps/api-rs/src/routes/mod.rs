pub mod admin;
pub mod ai;
pub mod auth;
pub mod console;
pub mod health;
pub mod import;
pub mod mcp;
pub mod registry;
pub mod services;

use crate::auth::middleware::AppState;
use axum::Router;

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
        .merge(ai::router())
}
