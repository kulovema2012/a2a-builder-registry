// apps/api-rs/src/routes/ai.rs
use axum::{
    extract::State,
    response::{IntoResponse, Sse},
    routing::post,
    Json, Router,
};
use axum::response::sse::Event;
use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use tokio_stream::wrappers::ReceiverStream;

use crate::{auth::middleware::{AppState, AuthUser}, errors::AppError};

// ── Request bodies ──────────────────────────────────────────────

#[derive(Deserialize)]
pub struct AutofillRequest {
    pub description: String,
}

#[derive(Deserialize)]
pub struct SuggestMessageRequest {
    pub skill_name: String,
    pub skill_description: String,
    pub examples: Vec<String>,
}

#[derive(Deserialize)]
pub struct ExplainCheckRequest {
    pub label: String,
    pub detail: String,
    pub state: String,
}

#[derive(Deserialize)]
pub struct NormalizeCardRequest {
    pub raw: String,
}

// ── OpenRouter client ───────────────────────────────────────────

struct OpenRouterClient {
    http: Client,
    api_key: String,
    base_url: String,
    model: String,
}

#[derive(Serialize)]
struct ChatMessage {
    role: &'static str,
    content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
    max_tokens: u32,
}

impl OpenRouterClient {
    fn new(state: &AppState) -> Self {
        Self {
            http: Client::new(),
            api_key: state.config.openrouter_api_key.clone(),
            base_url: state.config.openrouter_base_url.clone(),
            model: state.config.openrouter_model.clone(),
        }
    }

    async fn stream(
        &self,
        system: &str,
        user: String,
        max_tokens: u32,
    ) -> Result<impl futures::Stream<Item = Result<Event, Infallible>>, AppError> {
        let req = ChatRequest {
            model: self.model.clone(),
            messages: vec![
                ChatMessage { role: "system", content: system.to_string() },
                ChatMessage { role: "user", content: user },
            ],
            stream: true,
            max_tokens,
        };

        let resp = self
            .http
            .post(format!("{}/chat/completions", self.base_url))
            .bearer_auth(&self.api_key)
            .header("HTTP-Referer", "https://agents.cocotech.cloud")
            .header("X-Title", "A2A Builder & Registry")
            .json(&req)
            .send()
            .await
            .map_err(|e| AppError::Internal(e.into()))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(AppError::Internal(anyhow::anyhow!("OpenRouter {status}: {body}")));
        }

        let (tx, rx) = tokio::sync::mpsc::channel::<Result<Event, Infallible>>(32);
        let mut byte_stream = resp.bytes_stream();

        tokio::spawn(async move {
            let mut buf = String::new();
            while let Some(chunk) = byte_stream.next().await {
                let Ok(bytes) = chunk else { break };
                buf.push_str(&String::from_utf8_lossy(&bytes));
                while let Some(pos) = buf.find('\n') {
                    let line = buf[..pos].trim_end_matches('\r').to_string();
                    buf = buf[pos + 1..].to_string();
                    if line.starts_with("data: ") {
                        let data = &line[6..];
                        let _ = tx.send(Ok(Event::default().data(data))).await;
                        if data == "[DONE]" {
                            return;
                        }
                    }
                }
            }
            let _ = tx.send(Ok(Event::default().data("[DONE]"))).await;
        });

        Ok(ReceiverStream::new(rx))
    }
}

// ── Handlers ────────────────────────────────────────────────────

pub async fn autofill(
    _user: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<AutofillRequest>,
) -> Result<impl IntoResponse, AppError> {
    let client = OpenRouterClient::new(&state);
    let system = r#"You are an A2A agent card generator. Given a plain-English description of an AI agent, return ONLY valid JSON matching this exact shape (no markdown, no explanation):
{
  "name": "Short agent name (3-5 words max)",
  "description": "One to three sentence description",
  "version": "1.0.0",
  "provider": { "organization": "Inferred org name", "url": "https://example.com" },
  "tags": ["tag1", "tag2"],
  "skills": [
    { "id": "skill.id", "name": "Skill Name", "description": "What this skill does", "tags": [], "examples": ["Example user message"] }
  ],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "capabilities": { "streaming": false, "pushNotifications": false }
}"#;
    let stream = client.stream(system, body.description, 800).await?;
    Ok(Sse::new(stream))
}

pub async fn suggest_message(
    _user: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<SuggestMessageRequest>,
) -> Result<impl IntoResponse, AppError> {
    let client = OpenRouterClient::new(&state);
    let system = "You are a QA engineer writing test inputs for an AI agent skill. Return ONLY the test message text — no explanation, no quotes, no markdown. Make it realistic and specific.";
    let user = format!(
        "Skill: {}\nDescription: {}\nExamples: {}\n\nWrite one realistic test message for this skill.",
        body.skill_name,
        body.skill_description,
        body.examples.join(", ")
    );
    let stream = client.stream(system, user, 200).await?;
    Ok(Sse::new(stream))
}

pub async fn explain_check(
    _user: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<ExplainCheckRequest>,
) -> Result<impl IntoResponse, AppError> {
    let client = OpenRouterClient::new(&state);
    let system = "You are an A2A protocol expert helping developers fix agent card validation issues. Explain the problem in plain English and give a concrete, specific fix. Be concise (2-4 sentences max).";
    let severity = if body.state == "err" { "ERROR" } else { "WARNING" };
    let user = format!(
        "Validation {severity}: {}\nDetail: {}\n\nExplain what this means and how to fix it.",
        body.label, body.detail
    );
    let stream = client.stream(system, user, 200).await?;
    Ok(Sse::new(stream))
}

pub async fn normalize_card(
    _user: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<NormalizeCardRequest>,
) -> Result<impl IntoResponse, AppError> {
    if body.raw.len() > 64 * 1024 {
        return Err(AppError::UnprocessableEntity("Payload too large (max 64 KB)".into()));
    }
    let client = OpenRouterClient::new(&state);
    let system = r#"You are a JSON repair tool. The user has a malformed or non-standard agent card. Return ONLY valid JSON that conforms to the A2A agent card schema — no explanation, no markdown fences. Required fields: name (string), description (string), url (string), skills (array). Add reasonable defaults for any missing fields."#;
    let user = format!("Repair this malformed agent card JSON:\n{}", body.raw);
    let stream = client.stream(system, user, 1000).await?;
    Ok(Sse::new(stream))
}

// ── Router ──────────────────────────────────────────────────────

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/ai/autofill", post(autofill))
        .route("/ai/suggest-message", post(suggest_message))
        .route("/ai/explain-check", post(explain_check))
        .route("/ai/normalize-card", post(normalize_card))
}
