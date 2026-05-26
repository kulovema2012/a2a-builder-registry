use std::time::Duration;

use crate::mcp::types::McpInitializeRequest;

/// Send an MCP initialize handshake to the given server URL.
/// Returns true if the server responds with a JSON-RPC result.
pub async fn probe_mcp_server(server_url: &str, transport: &str, timeout_secs: u64) -> bool {
    if transport == "stdio" {
        return false;
    }

    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout_secs))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    let payload = McpInitializeRequest::default();

    match client.post(server_url).json(&payload).send().await {
        Ok(response) => {
            if !response.status().is_success() {
                return false;
            }
            match response.json::<serde_json::Value>().await {
                Ok(body) => {
                    body.get("jsonrpc").is_some()
                        && (body.get("result").is_some() || body.get("id").is_some())
                }
                Err(_) => false,
            }
        }
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_probe_unreachable_returns_false() {
        let result = probe_mcp_server("http://127.0.0.1:19999", "http", 1).await;
        assert!(!result);
    }

    #[tokio::test]
    async fn test_probe_stdio_always_false() {
        let result = probe_mcp_server("stdio://any", "stdio", 5).await;
        assert!(!result, "stdio transport must always return false from probe");
    }
}
