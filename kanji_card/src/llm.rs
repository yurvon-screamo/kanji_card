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
    pub translation: String,
}

#[derive(Debug, Deserialize)]
struct WordsResponse {
    words: Vec<ExtractedWord>,
}

#[derive(Debug, Deserialize)]
struct StoryResponse {
    story: Vec<String>,
    story_translate: Vec<String>,
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

    #[instrument(skip(self, text))]
    pub async fn extract_words_from_text(&self, text: &str) -> Result<Vec<ExtractedWord>> {
        info!("Extracting words from text");
        let prompt = format!(
            r#"Ты эксперт по японскому языку. Извлеки все японские слова из следующего текста и предоставь точные переводы.

ВАЖНЫЕ ПРАВИЛА:
1. Извлекай ТОЛЬКО японские слова (хирагана, катакана, кандзи или смешанные)
2. Предоставляй точные русские переводы
3. Игнорируй знаки препинания, числа и не-японский текст
4. Каждое слово должно извлекаться отдельно (не объединяй фразы)
5. Включай частицы (は, が, を, に и т.д.) как отдельные слова, если они встречаются отдельно
6. Для указательных местоимений (これ, それ, あれ и т.д.) предоставляй конкретные переводы
7. Пропускай дубликаты - если одно и то же слово встречается несколько раз, включи его только один раз

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{"words": [{{"word": "japanese_word", "translation": "russian_translation"}}]}}

Текст для анализа:
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
        let prompt = r#"Ты эксперт по японскому языку. Извлеки все японские слова из этого изображения и предоставь точные переводы.

ВАЖНЫЕ ПРАВИЛА:
1. Извлекай ТОЛЬКО японские слова (хирагана, катакана, кандзи или смешанные)
2. Предоставляй точные русские переводы
3. Игнорируй знаки препинания, числа и не-японский текст
4. Каждое слово должно извлекаться отдельно (не объединяй фразы)
5. Включай частицы (は, が, を, に и т.д.) как отдельные слова, если они встречаются отдельно
6. Для указательных местоимений (これ, それ, あれ и т.д.) предоставляй конкретные переводы
7. Пропускай дубликаты - если одно и то же слово встречается несколько раз, включи его только один раз

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{"words": [{"word": "japanese_word", "translation": "russian_translation"}]}

Проанализируй изображение и извлеки все японские слова:"#;

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

    #[instrument(skip(self, words))]
    pub async fn generate_story(
        &self,
        words: &[crate::domain::word::Card],
    ) -> Result<(Vec<String>, Vec<String>)> {
        info!("Generating story from {} words", words.len());

        let words_list: Vec<String> = words
            .iter()
            .map(|c| format!("{} - {}", c.word(), c.translation()))
            .collect();

        let prompt = format!(
            r#"Ты эксперт по японскому языку и рассказчик. Создай связную короткую историю, используя предоставленные японские слова. Используй ТОЛЬКО грамматику уровня N5.

ВАЖНЫЕ ПРАВИЛА:
1. Используй ВСЕ предоставленные слова в истории
2. Ты также можешь использовать базовые японские слова (частицы, обычные глаголы, прилагательные), чтобы сделать историю связной
3. Делай историю простой и понятной для изучающих японский язык
4. История должна быть длиной 3-5 предложений
5. Каждое предложение должно быть на отдельной строке
6. Предоставь точный русский перевод для каждого предложения
7. История должна быть логичной и интересной

Слова для использования:
{}

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{"story": ["sentence1_in_japanese", "sentence2_in_japanese", "sentence3_in_japanese"], "story_translate": ["sentence1_in_russian", "sentence2_in_russian", "sentence3_in_russian"]}}

Создай историю:"#,
            words_list.join("\n")
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
            max_tokens: 2000,
            temperature: 0.7,
        };

        let url = format!("{}/chat/completions", self.base_url);
        info!(
            "Sending story generation request to OpenRouter API at {}",
            url
        );

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
                    "Failed to send story generation request to OpenRouter API"
                );
                return Err(anyhow!(
                    "Failed to send story generation request to OpenRouter API: {}",
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
                "OpenRouter API returned error response for story generation"
            );
            return Err(anyhow!(
                "OpenRouter API error for story generation: {}",
                error_text
            ));
        }

        let openrouter_response: OpenRouterResponse = match response.json().await {
            Ok(resp) => resp,
            Err(e) => {
                error!(
                    error = %e,
                    "Failed to parse OpenRouter API response as JSON for story generation"
                );
                return Err(anyhow!(
                    "Failed to parse OpenRouter API response for story generation: {}",
                    e
                ));
            }
        };

        let content = openrouter_response
            .choices
            .first()
            .ok_or_else(|| {
                error!("No choices in OpenRouter API response for story generation");
                anyhow!("No choices in response for story generation")
            })?
            .message
            .content
            .trim();

        let content = content
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        let story_response: StoryResponse = serde_json::from_str(content).map_err(|e| {
            error!(
                error = %e,
                content = %content,
                "Failed to parse LLM story response as JSON"
            );
            anyhow!(
                "Failed to parse LLM story response as JSON: {}. Content: {}",
                e,
                content
            )
        })?;

        info!(
            "Successfully generated story with {} sentences",
            story_response.story.len()
        );
        Ok((story_response.story, story_response.story_translate))
    }

    #[instrument(skip(self, japanese_text))]
    pub async fn extract_grammar_rule_from_text(
        &self,
        japanese_text: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Extracting grammar rule from Japanese text");
        let prompt = format!(
            r#"Ты эксперт по японскому языку. Проанализируй следующий японский текст и определи основное грамматическое правило, которое используется. Создай подробное объяснение грамматического правила. Используй слова ТОЛЬКО уровня N5.

ВАЖНЫЕ ПРАВИЛА:
1. Определи основной грамматический паттерн/правило в тексте
2. Предоставь четкое название для правила
3. Дай подробный конспект на русском языке в формате Markdown, который ДОЛЖЕН включать:
   - Четкое определение грамматического правила
   - Пошаговое объяснение того, как работает правило и его структура
   - Конкретные паттерны образования с конкретными примерами
   - Когда и как использовать это грамматическое правило
   - Общие контексты использования и ситуации
   - Любые исключения или особые случаи
   - Сравнение с похожими грамматическими паттернами, если это уместно
   - Требуемые формы склонения/спряжения с похожими грамматическими паттернами, если это уместно
   - Используй заголовки (##, ###), списки, выделение текста (**жирный**, *курсив*, `тег`) и другие элементы Markdown для структурирования
4. Определи правильную часть речи из: Meishi, Daimeishi, Doushi, Keiyoushi, Keiyoudoushi, Fukushi, Rentaishi, Setsuzokushi, Joshi, Jodoushi, Kandoushi
5. Создай 4 примера с японским содержанием, русским переводом и объяснениями
6. Создай 5 простых тестовых вопросов, которые КОНКРЕТНО тестируют определенное грамматическое правило. Каждый тест ДОЛЖЕН фокусироваться на основном грамматическом паттерне и должен быть одного из этих типов:
   - Заполни пропуск: предоставь предложение с одним пропущенным словом/частицей, которое тестирует грамматическое правило (ответ 1-2 слова)
   - Множественный выбор: предоставь варианты в вопросе типа "Выбери: A) は B) が C) を", где выбор тестирует грамматическое правило
   - Завершить окончание: предоставь начало предложения, попроси завершить конкретной грамматической формой, которая изучается
   - Ответ одним словом: попроси конкретное слово/форму на японском, которое демонстрирует грамматическое правило (максимум 1-2 слова)
   - Каждый тестовый вопрос ДОЛЖЕН напрямую тестировать понимание основного грамматического правила, а не словарный запас или несвязанную грамматику
   - НИКАКИХ полных переводов предложений или сочинений

КРИТИЧНО: Все тестовые вопросы должны тестировать ТОЛЬКО конкретное грамматическое правило, определенное в заголовке. НЕ создавай тесты о:
- Общих знаниях словарного запаса
- Несвязанных грамматических паттернах
- Понимании прочитанного
- Культурных знаниях

Каждый тест должен требовать от студента демонстрации понимания конкретного изучаемого грамматического правила.

ПРИМЕРЫ ХОРОШИХ ТЕСТОВ:
- Для частицы は: "私___学生です。Выбери: A) は B) が C) を" (тестирует は как маркер темы)
- Для прошедшего времени: "昨日映画を見___。Завершить формой прошедшего времени" (тестирует образование прошедшего времени)
- Для спряжения прилагательных: "この本は___です。Заполни пропуск словом 'интересный' в вежливой форме" (тестирует использование прилагательных)

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{"title": "rule_title", "conspect": "detailed_conspect_in_russian_md", "part_of_speech": "part_of_speech_enum", "examples": [{{"title": "example_title", "content": "japanese_example", "description": "explanation_in_russian", "content_translation": "russian_translation"}}], "tests": [{{"rus_description": "test_description_in_russian", "question_content": "japanese_question", "answer": "correct_answer"}}]}}

Текст для анализа:
{}"#,
            japanese_text
        );

        self.send_grammar_request(prompt).await
    }

    #[instrument(skip(self, rule_description))]
    pub async fn generate_grammar_rule_from_description(
        &self,
        rule_description: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Generating grammar rule from description");
        let prompt = format!(
            r#"Ты эксперт по японскому языку. На основе следующего описания создай подробное объяснение японского грамматического правила. Используй слова ТОЛЬКО уровня N5.

ВАЖНЫЕ ПРАВИЛА:
1. Создай четкое название для правила на основе описания
2. Предоставь подробный конспект на русском языке в формате Markdown, который ДОЛЖЕН включать:
   - Четкое определение грамматического правила
   - Пошаговое объяснение того, как работает правило и его структура
   - Конкретные паттерны образования с конкретными примерами
   - Когда и как использовать это грамматическое правило
   - Общие контексты использования и ситуации
   - Любые исключения или особые случаи
   - Сравнение с похожими грамматическими паттернами, если это уместно
   - Требуемые формы склонения/спряжения с похожими грамматическими паттернами, если это уместно
   - Используй заголовки (##, ###), списки, выделение текста (**жирный**, *курсив*) и другие элементы Markdown для структурирования
3. Определи правильную часть речи из: Meishi, Daimeishi, Doushi, Keiyoushi, Keiyoudoushi, Fukushi, Rentaishi, Setsuzokushi, Joshi, Jodoushi, Kandoushi
4. Создай 4 примера с японским содержанием, русским переводом и объяснениями
5. Создай 5 простых тестовых вопросов, которые КОНКРЕТНО тестируют грамматическое правило из описания. Каждый тест ДОЛЖЕН фокусироваться на основном грамматическом паттерне и должен быть одного из этих типов:
   - Заполни пропуск: предоставь предложение с одним пропущенным словом/частицей, которое тестирует грамматическое правило (ответ 1-2 слова)
   - Множественный выбор: предоставь варианты в вопросе типа "Выбери: A) は B) が C) を", где выбор тестирует грамматическое правило
   - Завершить окончание: предоставь начало предложения, попроси завершить конкретной грамматической формой, которая изучается
   - Ответ одним словом: попроси конкретное слово/форму на японском, которое демонстрирует грамматическое правило (максимум 1-2 слова)
   - Каждый тестовый вопрос ДОЛЖЕН напрямую тестировать понимание основного грамматического правила, а не словарный запас или несвязанную грамматику
   - НИКАКИХ полных переводов предложений или сочинений
6. Убедись, что весь контент точен и образователен

КРИТИЧНО: Все тестовые вопросы должны тестировать ТОЛЬКО конкретное грамматическое правило из описания. НЕ создавай тесты о:
- Общих знаниях словарного запаса
- Несвязанных грамматических паттернах
- Понимании прочитанного
- Культурных знаниях

Каждый тест должен требовать от студента демонстрации понимания конкретного изучаемого грамматического правила.

ПРИМЕРЫ ХОРОШИХ ТЕСТОВ:
- Для частицы は: "私___学生です。Выбери: A) は B) が C) を" (тестирует は как маркер темы)
- Для прошедшего времени: "昨日映画を見___。Завершить формой прошедшего времени" (тестирует образование прошедшего времени)
- Для спряжения прилагательных: "この本は___です。Заполни пропуск словом 'интересный' в вежливой форме" (тестирует использование прилагательных)

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{"title": "rule_title", "conspect": "detailed_conspect_in_russian_md", "part_of_speech": "part_of_speech_enum", "examples": [{{"title": "example_title", "content": "japanese_example", "description": "explanation_in_russian", "content_translation": "russian_translation"}}], "tests": [{{"rus_description": "test_description_in_russian", "question_content": "japanese_question", "answer": "correct_answer"}}]}}

Описание правила:
{}"#,
            rule_description
        );

        self.send_grammar_request(prompt).await
    }

    #[instrument(skip(self, prompt))]
    async fn send_grammar_request(&self, prompt: String) -> Result<GrammarRuleResponse> {
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
            temperature: 0.3,
        };

        let url = format!("{}/chat/completions", self.base_url);
        info!("Sending grammar rule request to OpenRouter API at {}", url);

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
                    "Failed to send grammar rule request to OpenRouter API"
                );
                return Err(anyhow!(
                    "Failed to send grammar rule request to OpenRouter API: {}",
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
                "OpenRouter API returned error response for grammar rule"
            );
            return Err(anyhow!(
                "OpenRouter API error for grammar rule: {}",
                error_text
            ));
        }

        let openrouter_response: OpenRouterResponse = match response.json().await {
            Ok(resp) => resp,
            Err(e) => {
                error!(
                    error = %e,
                    "Failed to parse OpenRouter API response as JSON for grammar rule"
                );
                return Err(anyhow!(
                    "Failed to parse OpenRouter API response for grammar rule: {}",
                    e
                ));
            }
        };

        let content = openrouter_response
            .choices
            .first()
            .ok_or_else(|| {
                error!("No choices in OpenRouter API response for grammar rule");
                anyhow!("No choices in response for grammar rule")
            })?
            .message
            .content
            .trim();

        let content = content
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        let grammar_response: GrammarRuleResponse = serde_json::from_str(content).map_err(|e| {
            error!(
                error = %e,
                content = %content,
                "Failed to parse LLM grammar rule response as JSON"
            );
            anyhow!(
                "Failed to parse LLM grammar rule response as JSON: {}. Content: {}",
                e,
                content
            )
        })?;

        info!(
            "Successfully generated grammar rule: {}",
            grammar_response.title
        );
        Ok(grammar_response)
    }
}
