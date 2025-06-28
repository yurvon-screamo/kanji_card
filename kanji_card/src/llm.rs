use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};
use utoipa::ToSchema;

#[derive(Debug, Serialize)]
struct OpenRouterRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
    temperature: f32,
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

// Public types that will be used by services
#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct ExtractedWord {
    pub word: String,
    pub translation: String,
}

#[derive(Debug, Deserialize)]
pub struct WordsResponse {
    pub words: Vec<ExtractedWord>,
}

#[derive(Debug, Deserialize)]
pub struct StoryResponse {
    pub story: Vec<String>,
    pub story_translate: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct GrammarRuleResponse {
    pub title: String,
    pub conspect: String,
    pub part_of_speech: String,
    pub examples: Vec<GrammarExampleResponse>,
    pub tests: Vec<GrammarTestResponse>,
}

#[derive(Debug, Deserialize)]
pub struct GrammarExampleResponse {
    pub title: String,
    pub content: String,
    pub description: String,
    pub content_translation: String,
}

#[derive(Debug, Deserialize)]
pub struct GrammarTestResponse {
    pub rus_description: String,
    pub question_content: String,
    pub answer: String,
}

#[derive(Clone)]
pub struct LlmService {
    client: reqwest::Client,
    base_url: String,
    api_key: String,
    model: String,
}

impl LlmService {
    pub fn new(base_url: String, api_key: String, model: String) -> Self {
        info!("Initializing LLM service with model {}", model);
        Self {
            client: reqwest::Client::new(),
            base_url,
            api_key,
            model,
        }
    }

    /// Generic method to send a request to the LLM and parse the response
    #[instrument(skip(self, messages))]
    pub async fn send_request<T>(
        &self,
        messages: Vec<Message>,
        max_tokens: u32,
        temperature: f32,
    ) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let request = OpenRouterRequest {
            model: self.model.clone(),
            messages,
            max_tokens,
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

    pub fn create_text_content(text: String) -> Content {
        Content::Text {
            content_type: "text".to_string(),
            text,
        }
    }

    pub fn create_image_content(image_base64: &str) -> Content {
        let image_url = format!("data:image/jpeg;base64,{}", image_base64);
        Content::Image {
            content_type: "image_url".to_string(),
            image_url: ImageUrl { url: image_url },
        }
    }

    pub fn create_user_message(content: Vec<Content>) -> Message {
        Message {
            role: "user".to_string(),
            content,
        }
    }
}
