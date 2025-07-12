use serde::Deserialize;
use std::time::Duration;
use tracing::info;

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub domain: String,
    pub port: u16,
}

#[derive(Debug, Deserialize, Clone)]
pub struct OpenRouterConfig {
    pub base_url: String,
    pub api_key: String,
    pub text_model: String,
    pub image_model: String,
    pub reasoning_model: String,
    pub max_completion_tokens: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    pub secret_key: String,
    pub token_expiry: u64,
    pub refresh_threshold: u64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct TlsConfig {
    pub cert_path: String,
    pub key_path: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct PromptsConfig {
    pub extract_words_from_text: String,
    pub extract_words_from_image: String,
    pub extract_grammar_rule_from_text: String,
    pub generate_grammar_rule_from_description: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Settings {
    pub server: ServerConfig,
    pub openrouter: OpenRouterConfig,
    pub jwt: JwtConfig,
    pub tls: Option<TlsConfig>,
    pub prompts: PromptsConfig,
}

impl Settings {
    pub fn load() -> Result<Self, config::ConfigError> {
        config::Config::builder()
            .add_source(config::File::with_name("config"))
            .add_source(
                config::Environment::with_prefix("KANJI_CARD")
                    .separator("_")
                    .try_parsing(true),
            )
            .build()?
            .try_deserialize::<Settings>()
    }

    pub fn jwt_config(&self) -> crate::environment::auth::JwtConfig {
        crate::environment::auth::JwtConfig {
            secret: self.jwt.secret_key.as_bytes().to_vec(),
            token_expiry: Duration::from_secs(self.jwt.token_expiry),
            refresh_threshold: Duration::from_secs(self.jwt.refresh_threshold),
        }
    }
}
