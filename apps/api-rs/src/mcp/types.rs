use serde::{Deserialize, Serialize};

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum McpTransport {
    Http,
    Sse,
    Stdio,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpConnection {
    pub name: String,
    pub server_url: String,
    pub transport: McpTransport,
    pub capabilities: Vec<String>,
    pub auth_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct McpInitializeRequest {
    pub jsonrpc: String,
    pub method: String,
    pub params: McpInitializeParams,
    pub id: u32,
}

#[derive(Debug, Serialize)]
pub struct McpInitializeParams {
    #[serde(rename = "protocolVersion")]
    pub protocol_version: String,
    #[serde(rename = "clientInfo")]
    pub client_info: McpClientInfo,
}

#[derive(Debug, Serialize)]
pub struct McpClientInfo {
    pub name: String,
    pub version: String,
}

impl Default for McpInitializeRequest {
    fn default() -> Self {
        McpInitializeRequest {
            jsonrpc: "2.0".to_string(),
            method: "initialize".to_string(),
            params: McpInitializeParams {
                protocol_version: "2024-11-05".to_string(),
                client_info: McpClientInfo {
                    name: "pier-registry".to_string(),
                    version: "1.0.0".to_string(),
                },
            },
            id: 1,
        }
    }
}
