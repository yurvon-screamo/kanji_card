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
struct Message {
    role: String,
    content: Vec<Content>,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
enum Content {
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
struct ImageUrl {
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

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct ExtractedWord {
    pub word: String,
    pub reading: Option<String>,
    pub translation: String,
}

#[derive(Debug, Deserialize)]
struct WordsResponse {
    words: Vec<ExtractedWord>,
}

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

    #[instrument(skip(self, text))]
    pub async fn extract_words_from_text(&self, text: &str) -> Result<Vec<ExtractedWord>> {
        info!("Extracting words from text");
        let prompt = format!(
            r#"Extract all Japanese words from the following text. For each word:
- If it contains kanji, provide the reading in hiragana
- If it's only hiragana/katakana, reading is not needed
- Provide Russian translation
- Return ONLY valid JSON in this exact format:

{{"words": [{{"word": "example", "reading": "example_reading_or_null", "translation": "example_translation"}}]}}

Text to analyze:
{}"#,
            text
        );

        let request = OpenRouterRequest {
            model: self.model.clone(),
            messages: vec![Message {
                role: "user".to_string(),
                content: vec![Content::Text {
                    content_type: "text".to_string(),
                    text: prompt,
                }],
            }],
            max_tokens: 4000,
            temperature: 0.1,
        };

        let words = self.send_request(request).await?;
        info!("Successfully extracted {} words from text", words.len());
        Ok(words)
    }

    #[instrument(skip(self, image_base64))]
    pub async fn extract_words_from_image(&self, image_base64: &str) -> Result<Vec<ExtractedWord>> {
        info!("Extracting words from image");
        let prompt = r#"Extract all Japanese words from this image. For each word:
- If it contains kanji, provide the reading in hiragana
- If it's only hiragana/katakana, reading is not needed
- Provide Russian translation
- Return ONLY valid JSON in this exact format:

{"words": [{"word": "example", "reading": "example_reading_or_null", "translation": "example_translation"}]}

Analyze the image and extract Japanese text:"#;

        let image_url = format!("data:image/jpeg;base64,{}", image_base64);

        let request = OpenRouterRequest {
            model: self.model.clone(),
            messages: vec![Message {
                role: "user".to_string(),
                content: vec![
                    Content::Text {
                        content_type: "text".to_string(),
                        text: prompt.to_string(),
                    },
                    Content::Image {
                        content_type: "image_url".to_string(),
                        image_url: ImageUrl { url: image_url },
                    },
                ],
            }],
            max_tokens: 4000,
            temperature: 0.1,
        };

        let words = self.send_request(request).await?;
        info!("Successfully extracted {} words from image", words.len());
        Ok(words)
    }

    #[instrument(skip(self, request))]
    async fn send_request(&self, request: OpenRouterRequest) -> Result<Vec<ExtractedWord>> {
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

        let words_response: WordsResponse = serde_json::from_str(content).map_err(|e| {
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
        Ok(words_response.words)
    }
}
