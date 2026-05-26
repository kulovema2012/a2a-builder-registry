use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_access_ttl: i64,
    pub jwt_refresh_ttl: i64,
    pub cors_origins: Vec<String>,
    pub agent_card_fetch_timeout: u64,
    pub mcp_probe_timeout: u64,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();
        Ok(Config {
            database_url: required("DATABASE_URL")?,
            jwt_secret: required("JWT_SECRET")?,
            jwt_access_ttl: env::var("JWT_ACCESS_TTL_SECONDS")
                .unwrap_or_else(|_| "900".to_string())
                .parse()?,
            jwt_refresh_ttl: env::var("JWT_REFRESH_TTL_SECONDS")
                .unwrap_or_else(|_| "604800".to_string())
                .parse()?,
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            agent_card_fetch_timeout: env::var("AGENT_CARD_FETCH_TIMEOUT_SECS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()?,
            mcp_probe_timeout: env::var("MCP_PROBE_TIMEOUT_SECS")
                .unwrap_or_else(|_| "5".to_string())
                .parse()?,
            port: env::var("PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()?,
        })
    }
}

fn required(key: &str) -> anyhow::Result<String> {
    env::var(key).map_err(|_| anyhow::anyhow!("Required env var {key} is not set"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_required_missing_returns_error() {
        env::remove_var("__TEST_MISSING_VAR");
        let result = required("__TEST_MISSING_VAR");
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("__TEST_MISSING_VAR"));
    }

    #[test]
    fn test_cors_origins_parses_multiple() {
        env::set_var(
            "CORS_ORIGINS",
            "http://localhost:3000, http://localhost:3001",
        );
        env::set_var("DATABASE_URL", "postgresql://x");
        env::set_var("JWT_SECRET", "a".repeat(32));
        let cfg = Config::from_env().unwrap();
        assert_eq!(cfg.cors_origins.len(), 2);
        assert_eq!(cfg.cors_origins[0], "http://localhost:3000");
    }
}
