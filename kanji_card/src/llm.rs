use anyhow::{Result, anyhow};
use base64::{Engine, engine::general_purpose};
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};
use utoipa::ToSchema;

use crate::word::domain::JapanesePartOfSpeech;

#[derive(Debug, Serialize)]
struct OpenRouterRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Debug, Serialize)]
struct OpenRouterReasoningRequest {
    model: String,
    messages: Vec<Message>,
    max_completion_tokens: u32,
}

#[derive(Debug, Serialize)]
pub struct Message {
    pub role: String,
    pub content: Vec<Content>,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum Content {
    Text {
        #[serde(rename = "type")]
        content_type: String,
        text: String,
    },
    Image {
        #[serde(rename = "type")]
        content_type: String,
        image_url: ImageUrl,
    },
}

#[derive(Debug, Serialize)]
pub struct ImageUrl {
    url: String,
}

#[derive(Debug, Deserialize)]
struct OpenRouterResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ResponseMessage {
    content: String,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq, ToSchema, Clone, Hash)]
pub struct ExtractedWord {
    pub word: String,
    pub translation: String,
    pub part_of_speech: JapanesePartOfSpeech,
}

#[derive(Debug, Deserialize)]
pub struct WordsResponse {
    pub words: Vec<ExtractedWord>,
}

#[derive(Clone)]
pub struct LlmService {
    client: reqwest::Client,
    base_url: String,
    api_key: String,
    text_model: String,
    image_model: String,
    reasoning_model: String,
    max_completion_tokens: u32,
}

impl LlmService {
    pub fn new(
        base_url: String,
        api_key: String,
        text_model: String,
        image_model: String,
        reasoning_model: String,
        max_completion_tokens: u32,
    ) -> Self {
        info!(
            "Initializing LLM service with text model: {}, image model: {}, reasoning model: {}",
            text_model, image_model, reasoning_model
        );
        Self {
            client: reqwest::Client::new(),
            base_url,
            api_key,
            text_model,
            image_model,
            reasoning_model,
            max_completion_tokens,
        }
    }
    #[instrument(skip(self, prompt))]
    pub async fn send_image_request<T>(
        &self,
        prompt: &str,
        image_data: &[u8],
        temperature: f32,
    ) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let image_base64 = general_purpose::STANDARD.encode(image_data);
        let messages = vec![create_user_message(vec![
            create_text_content(prompt),
            create_image_content(&image_base64),
        ])];

        self.invoke_with_model(&self.image_model, messages, temperature)
            .await
    }

    #[instrument(skip(self, prompt))]
    pub async fn send_request<T>(&self, prompt: &str, temperature: f32) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let messages = vec![create_user_message(vec![create_text_content(prompt)])];
        self.invoke_with_model(&self.text_model, messages, temperature)
            .await
    }

    #[instrument(skip(self, prompt))]
    pub async fn send_reasoning_request<T>(&self, prompt: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let messages = vec![create_user_message(vec![create_text_content(prompt)])];
        self.invoke_reasoning(&self.reasoning_model, messages).await
    }

    #[instrument(skip(self, messages))]
    async fn invoke_reasoning<T>(&self, model: &str, messages: Vec<Message>) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let request = OpenRouterReasoningRequest {
            model: model.to_string(),
            messages,
            max_completion_tokens: self.max_completion_tokens,
        };

        let url = format!("{}/chat/completions", self.base_url);
        info!("Sending reasoning request to OpenRouter API at {}", url);

        let response = match self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
        {
            Ok(resp) => resp,
            Err(e) => {
                error!(
                    error = %e,
                    error_type = ?e.status(),
                    "Failed to send reasoning request to OpenRouter API"
                );
                return Err(anyhow!(
                    "Failed to send reasoning request to OpenRouter API: {}",
                    e
                ));
            }
        };

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await?;
            error!(
                status = %status,
                error_text = %error_text,
                "OpenRouter API returned error response for reasoning request"
            );
            return Err(anyhow!("OpenRouter API error: {}", error_text));
        }

        info!("Successfully received reasoning response from OpenRouter API");

        let openrouter_response: OpenRouterResponse = match response.json().await {
            Ok(resp) => resp,
            Err(e) => {
                error!(
                    error = %e,
                    "Failed to parse OpenRouter API response as JSON for reasoning request"
                );
                return Err(anyhow!("Failed to parse OpenRouter API response: {}", e));
            }
        };

        let content = openrouter_response
            .choices
            .first()
            .ok_or_else(|| {
                error!("No choices in OpenRouter API response for reasoning request");
                anyhow!("No choices in response")
            })?
            .message
            .content
            .trim();

        let content = content
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        let parsed_response: T = serde_json::from_str(content).map_err(|e| {
            error!(
                error = %e,
                content = %content,
                "Failed to parse LLM reasoning response as JSON"
            );
            anyhow!(
                "Failed to parse LLM reasoning response as JSON: {}. Content: {}",
                e,
                content
            )
        })?;

        info!("Successfully parsed reasoning response from OpenRouter API");
        Ok(parsed_response)
    }

    #[instrument(skip(self, messages))]
    async fn invoke_with_model<T>(
        &self,
        model: &str,
        messages: Vec<Message>,
        temperature: f32,
    ) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let request = OpenRouterRequest {
            model: model.to_string(),
            messages,
            max_tokens: self.max_completion_tokens,
            temperature,
        };

        let url = format!("{}/chat/completions", self.base_url);
        info!("Sending request to OpenRouter API at {}", url);

        let response = match self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
        {
            Ok(resp) => resp,
            Err(e) => {
                error!(
                    error = %e,
                    error_type = ?e.status(),
                    "Failed to send request to OpenRouter API"
                );
                return Err(anyhow!("Failed to send request to OpenRouter API: {}", e));
            }
        };

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await?;
            error!(
                status = %status,
                error_text = %error_text,
                "OpenRouter API returned error response"
            );
            return Err(anyhow!("OpenRouter API error: {}", error_text));
        }

        let openrouter_response: OpenRouterResponse = match response.json().await {
            Ok(resp) => resp,
            Err(e) => {
                error!(
                    error = %e,
                    "Failed to parse OpenRouter API response as JSON"
                );
                return Err(anyhow!("Failed to parse OpenRouter API response: {}", e));
            }
        };

        let content = openrouter_response
            .choices
            .first()
            .ok_or_else(|| {
                error!("No choices in OpenRouter API response");
                anyhow!("No choices in response")
            })?
            .message
            .content
            .trim();

        let content = content
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        let parsed_response: T = serde_json::from_str(content).map_err(|e| {
            error!(
                error = %e,
                content = %content,
                "Failed to parse LLM response as JSON"
            );
            anyhow!(
                "Failed to parse LLM response as JSON: {}. Content: {}",
                e,
                content
            )
        })?;

        info!("Successfully parsed response from OpenRouter API");
        Ok(parsed_response)
    }
}

fn create_text_content(text: &str) -> Content {
    Content::Text {
        content_type: "text".to_string(),
        text: text.to_owned(),
    }
}

fn create_image_content(image_base64: &str) -> Content {
    let image_url = format!("data:image/jpeg;base64,{image_base64}");
    Content::Image {
        content_type: "image_url".to_string(),
        image_url: ImageUrl { url: image_url },
    }
}

fn create_user_message(content: Vec<Content>) -> Message {
    Message {
        role: "user".to_string(),
        content,
    }
}
