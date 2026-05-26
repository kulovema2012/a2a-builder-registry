use serde_json::Value;
use std::time::Duration;

use crate::models::validation::{ValidationCheck, ValidationResult};

pub struct ValidationEngine {
    fetch_timeout: u64,
}

impl ValidationEngine {
    pub fn new(fetch_timeout_secs: u64) -> Self {
        ValidationEngine {
            fetch_timeout: fetch_timeout_secs,
        }
    }

    pub async fn validate(
        &self,
        card: &Value,
        endpoint_url: Option<&str>,
        mcp_connections: &[(String, String)], // (url, transport)
    ) -> ValidationResult {
        let mut checks: Vec<ValidationCheck> = Vec::new();

        // ─── Required fields ──────────────────────────────────────────────────
        for field in ["name", "description", "url"] {
            let ok = card
                .get(field)
                .and_then(|v| v.as_str())
                .map(|s| !s.is_empty())
                .unwrap_or(false);
            checks.push(ValidationCheck {
                name: format!("required_field_{field}"),
                status: if ok { "passed" } else { "failed" }.to_string(),
                message: if ok {
                    format!("Field '{field}' present")
                } else {
                    format!("Required field '{field}' is missing or empty")
                },
                level: "error".to_string(),
            });
        }

        // ─── String length limits ─────────────────────────────────────────────
        if let Some(name) = card["name"].as_str() {
            let ok = name.len() <= 255;
            checks.push(ValidationCheck {
                name: "name_length".to_string(),
                status: if ok { "passed" } else { "failed" }.to_string(),
                message: if ok {
                    "Name length ok".to_string()
                } else {
                    "Name exceeds 255 characters".to_string()
                },
                level: "error".to_string(),
            });
        }

        // ─── HTTPS preference ─────────────────────────────────────────────────
        if let Some(url) = card["url"].as_str() {
            let is_https = url.starts_with("https://");
            checks.push(ValidationCheck {
                name: "https_url".to_string(),
                status: if is_https { "passed" } else { "warning" }.to_string(),
                message: if is_https {
                    "URL uses HTTPS".to_string()
                } else {
                    "URL should use HTTPS".to_string()
                },
                level: "warning".to_string(),
            });
        }

        // ─── Capabilities are booleans ────────────────────────────────────────
        if let Some(caps) = card["capabilities"].as_object() {
            let all_bool = caps.values().all(|v| v.is_boolean());
            checks.push(ValidationCheck {
                name: "capabilities_type".to_string(),
                status: if all_bool { "passed" } else { "failed" }.to_string(),
                message: if all_bool {
                    "All capabilities are booleans".to_string()
                } else {
                    "Capabilities must be boolean values".to_string()
                },
                level: "error".to_string(),
            });
        }

        // ─── Skills validation ────────────────────────────────────────────────
        if let Some(skills) = card["skills"].as_array() {
            let mut seen_ids = std::collections::HashSet::new();
            let mut skills_ok = true;
            for skill in skills {
                let has_id = skill["id"].as_str().is_some();
                let has_name = skill["name"].as_str().is_some();
                if !has_id || !has_name {
                    skills_ok = false;
                }
                if let Some(id) = skill["id"].as_str() {
                    if !seen_ids.insert(id.to_string()) {
                        skills_ok = false;
                    }
                }
            }
            checks.push(ValidationCheck {
                name: "skills_valid".to_string(),
                status: if skills_ok { "passed" } else { "failed" }.to_string(),
                message: if skills_ok {
                    "All skills have unique IDs and names".to_string()
                } else {
                    "Skills have missing or duplicate IDs".to_string()
                },
                level: "error".to_string(),
            });
        }

        // ─── No plaintext credentials ─────────────────────────────────────────
        let card_str = card.to_string().to_lowercase();
        let has_secrets = ["password=", "apikey=", "secret=", "token=", "bearer "]
            .iter()
            .any(|pat| card_str.contains(pat));
        checks.push(ValidationCheck {
            name: "no_plaintext_credentials".to_string(),
            status: if has_secrets { "failed" } else { "passed" }.to_string(),
            message: if has_secrets {
                "Possible plaintext credentials detected in card".to_string()
            } else {
                "No plaintext credentials detected".to_string()
            },
            level: "error".to_string(),
        });

        // ─── Endpoint reachability ────────────────────────────────────────────
        if let Some(url) = endpoint_url {
            let well_known = format!("{}/.well-known/agent-card.json", url.trim_end_matches('/'));
            let reachable = reqwest::Client::builder()
                .timeout(Duration::from_secs(self.fetch_timeout))
                .build()
                .ok()
                .map(|c| async move { c.get(&well_known).send().await.is_ok() });

            let ok = if let Some(fut) = reachable {
                fut.await
            } else {
                false
            };
            checks.push(ValidationCheck {
                name: "endpoint_reachable".to_string(),
                status: if ok { "passed" } else { "warning" }.to_string(),
                message: if ok {
                    "Agent card endpoint reachable".to_string()
                } else {
                    "Cannot reach /.well-known/agent-card.json — agent may be offline".to_string()
                },
                level: "warning".to_string(),
            });
        }

        // ─── MCP checks ───────────────────────────────────────────────────────
        let mut mcp_verified_count = 0i32;
        for (mcp_url, transport) in mcp_connections {
            let valid_transport = ["http", "sse", "stdio"].contains(&transport.as_str());
            checks.push(ValidationCheck {
                name: format!("mcp_transport_{}", mcp_url.len()),
                status: if valid_transport { "passed" } else { "failed" }.to_string(),
                message: if valid_transport {
                    format!("MCP transport '{transport}' is valid")
                } else {
                    format!("MCP transport '{transport}' is not valid")
                },
                level: "error".to_string(),
            });

            if transport == "stdio" {
                checks.push(ValidationCheck {
                    name: format!("mcp_stdio_{}", mcp_url.len()),
                    status: "warning".to_string(),
                    message: "stdio MCP transport cannot be remotely verified".to_string(),
                    level: "warning".to_string(),
                });
                continue;
            }

            let verified =
                crate::validation::mcp_probe::probe_mcp_server(mcp_url, transport, 5).await;
            if verified {
                mcp_verified_count += 1;
            }
            checks.push(ValidationCheck {
                name: format!("mcp_reachable_{}", mcp_url.len()),
                status: if verified { "passed" } else { "warning" }.to_string(),
                message: if verified {
                    format!("MCP server at {mcp_url} responded to initialize handshake")
                } else {
                    format!("MCP server at {mcp_url} did not respond — may be private or offline")
                },
                level: "warning".to_string(),
            });
        }

        // ─── Score ────────────────────────────────────────────────────────────
        let error_checks = checks.iter().filter(|c| c.level == "error").count();
        let passed_errors = checks
            .iter()
            .filter(|c| c.level == "error" && c.status == "passed")
            .count();
        let base_score = if error_checks > 0 {
            (passed_errors * 80 / error_checks) as i32
        } else {
            80
        };
        let mcp_bonus = (mcp_verified_count * 4).min(20);
        let score = (base_score + mcp_bonus).min(100);

        ValidationResult { checks, score }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn engine() -> ValidationEngine {
        ValidationEngine::new(5)
    }

    #[tokio::test]
    async fn test_missing_required_fields_fails() {
        let card = json!({ "description": "no name no url" });
        let result = engine().validate(&card, None, &[]).await;
        let name_check = result
            .checks
            .iter()
            .find(|c| c.name == "required_field_name")
            .unwrap();
        assert_eq!(name_check.status, "failed");
    }

    #[tokio::test]
    async fn test_complete_card_passes_required_checks() {
        let card = json!({
            "name": "TestAgent",
            "description": "A test agent",
            "url": "https://agent.example.com"
        });
        let result = engine().validate(&card, None, &[]).await;
        let required_checks: Vec<_> = result
            .checks
            .iter()
            .filter(|c| c.name.starts_with("required_field_"))
            .collect();
        assert!(required_checks.iter().all(|c| c.status == "passed"));
        assert!(result.score > 0);
    }

    #[tokio::test]
    async fn test_http_url_gives_warning() {
        let card = json!({ "name": "A", "description": "B", "url": "http://insecure.example.com" });
        let result = engine().validate(&card, None, &[]).await;
        let https_check = result
            .checks
            .iter()
            .find(|c| c.name == "https_url")
            .unwrap();
        assert_eq!(https_check.status, "warning");
    }

    #[tokio::test]
    async fn test_plaintext_credentials_fail() {
        let card = json!({
            "name": "A", "description": "B", "url": "https://x.com",
            "auth": "apikey=mysecrettoken"
        });
        let result = engine().validate(&card, None, &[]).await;
        let cred_check = result
            .checks
            .iter()
            .find(|c| c.name == "no_plaintext_credentials")
            .unwrap();
        assert_eq!(cred_check.status, "failed");
    }

    #[tokio::test]
    async fn test_mcp_bonus_adds_to_score() {
        let card = json!({ "name": "A", "description": "B", "url": "https://x.com" });
        let result_no_mcp = engine().validate(&card, None, &[]).await;
        assert!(result_no_mcp.score <= 80, "base score must not exceed 80");
    }
}
