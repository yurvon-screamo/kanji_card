use crate::domain::rule::{GrammarRule, JapanesePartOfSpeech, RuleExample, RuleTest};
use crate::llm::{GrammarRuleResponse, LlmService};
use crate::rule_repository::RuleRepository;
use anyhow::Result;
use tracing::{error, info, instrument};

pub struct RuleService {
    rule_repository: RuleRepository,
    llm_service: LlmService,
}

impl RuleService {
    pub fn new(rule_repository: RuleRepository, llm_service: LlmService) -> Self {
        Self {
            rule_repository,
            llm_service,
        }
    }

    #[instrument(skip(self, japanese_text))]
    pub async fn create_from_text(
        &self,
        user_login: &str,
        japanese_text: &str,
    ) -> Result<GrammarRule> {
        info!("Creating grammar rule from Japanese text");

        let llm_response = self.extract_grammar_rule_from_text(japanese_text).await?;

        let part_of_speech = self.parse_part_of_speech(&llm_response.part_of_speech)?;

        let examples: Vec<RuleExample> = llm_response
            .examples
            .into_iter()
            .map(|ex| {
                RuleExample::new(ex.title, ex.content, ex.description, ex.content_translation)
            })
            .collect();

        let tests: Vec<RuleTest> = llm_response
            .tests
            .into_iter()
            .map(|test| RuleTest::new(test.rus_description, test.question_content, test.answer))
            .collect();

        let grammar_rule = GrammarRule::new(
            llm_response.title,
            llm_response.conspect,
            part_of_speech,
            examples,
            tests,
        );

        self.rule_repository.save(user_login, &grammar_rule).await?;

        info!(
            "Successfully created grammar rule: {}",
            grammar_rule.title()
        );
        Ok(grammar_rule)
    }

    #[instrument(skip(self, rule_description))]
    pub async fn create_from_description(
        &self,
        user_login: &str,
        rule_description: &str,
    ) -> Result<GrammarRule> {
        info!("Creating grammar rule from description");

        let llm_response = self.generate_grammar_rule_from_description(rule_description).await?;

        let part_of_speech = self.parse_part_of_speech(&llm_response.part_of_speech)?;

        let examples: Vec<RuleExample> = llm_response
            .examples
            .into_iter()
            .map(|ex| {
                RuleExample::new(ex.title, ex.content, ex.description, ex.content_translation)
            })
            .collect();

        let tests: Vec<RuleTest> = llm_response
            .tests
            .into_iter()
            .map(|test| RuleTest::new(test.rus_description, test.question_content, test.answer))
            .collect();

        let grammar_rule = GrammarRule::new(
            llm_response.title,
            llm_response.conspect,
            part_of_speech,
            examples,
            tests,
        );

        self.rule_repository.save(user_login, &grammar_rule).await?;

        info!(
            "Successfully created grammar rule: {}",
            grammar_rule.title()
        );
        Ok(grammar_rule)
    }

    fn parse_part_of_speech(&self, pos_str: &str) -> Result<JapanesePartOfSpeech> {
        match pos_str {
            "Meishi" => Ok(JapanesePartOfSpeech::Meishi),
            "Daimeishi" => Ok(JapanesePartOfSpeech::Daimeishi),
            "Doushi" => Ok(JapanesePartOfSpeech::Doushi),
            "Keiyoushi" => Ok(JapanesePartOfSpeech::Keiyoushi),
            "Keiyoudoushi" => Ok(JapanesePartOfSpeech::Keiyoudoushi),
            "Fukushi" => Ok(JapanesePartOfSpeech::Fukushi),
            "Rentaishi" => Ok(JapanesePartOfSpeech::Rentaishi),
            "Setsuzokushi" => Ok(JapanesePartOfSpeech::Setsuzokushi),
            "Joshi" => Ok(JapanesePartOfSpeech::Joshi),
            "Jodoushi" => Ok(JapanesePartOfSpeech::Jodoushi),
            "Kandoushi" => Ok(JapanesePartOfSpeech::Kandoushi),
            _ => {
                error!("Unknown part of speech: {}", pos_str);
                Err(anyhow::anyhow!("Unknown part of speech: {}", pos_str))
            }
        }
    }

    #[instrument(skip(self))]
    pub async fn check_test_answer(
        &self,
        user_login: &str,
        rule_id: &str,
        test_id: &str,
        answer: &str,
    ) -> Result<bool> {
        info!(
            "Checking test answer for rule: {}, test: {}",
            rule_id, test_id
        );

        let rule = self.rule_repository.load(user_login, rule_id).await?;
        Ok(rule.check_test(test_id, answer))
    }

    #[instrument(skip(self))]
    pub async fn release_rule(&self, user_login: &str, rule_id: &str) -> Result<()> {
        info!("Releasing rule: {}", rule_id);

        let mut rule = self.rule_repository.load(user_login, rule_id).await?;
        rule.release();
        self.rule_repository.save(user_login, &rule).await?;

        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn remove_rule(&self, user_login: &str, rule_id: &str) -> Result<()> {
        info!("Removing rule: {}", rule_id);

        self.rule_repository.remove(user_login, rule_id).await?;

        Ok(())
    }

    #[instrument(skip(self, japanese_text))]
    async fn extract_grammar_rule_from_text(
        &self,
        japanese_text: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Extracting grammar rule from Japanese text");

        let prompt = format!(
            r#"Ты эксперт по японскому языку и грамматике. Проанализируй предоставленный японский текст и извлеки из него грамматическое правило.

ВАЖНЫЕ ПРАВИЛА:
1. Определи основное грамматическое правило или конструкцию в тексте
2. Создай подробный конспект правила на русском языке
3. Определи часть речи (используй только: Meishi, Daimeishi, Doushi, Keiyoushi, Keiyoudoushi, Fukushi, Rentaishi, Setsuzokushi, Joshi, Jodoushi, Kandoushi)
4. Создай 3-5 примеров использования правила
5. Создай 3-5 тестовых вопросов для проверки понимания

Текст для анализа:
{}

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{
  "title": "Название правила",
  "conspect": "Подробный конспект правила на русском языке",
  "part_of_speech": "Часть речи",
  "examples": [
    {{
      "title": "Заголовок примера",
      "content": "Японский текст примера",
      "description": "Объяснение примера на русском",
      "content_translation": "Перевод примера на русский"
    }}
  ],
  "tests": [
    {{
      "rus_description": "Описание задания на русском",
      "question_content": "Вопрос на японском",
      "answer": "Правильный ответ"
    }}
  ]
}}

Извлеки грамматическое правило:"#,
            japanese_text
        );

        let messages = vec![LlmService::create_user_message(vec![
            LlmService::create_text_content(prompt)
        ])];

        let response: GrammarRuleResponse = self.llm_service.send_request(messages, 3000, 0.3).await?;
        info!("Successfully extracted grammar rule: {}", response.title);
        Ok(response)
    }

    #[instrument(skip(self, rule_description))]
    async fn generate_grammar_rule_from_description(
        &self,
        rule_description: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Generating grammar rule from description");

        let prompt = format!(
            r#"Ты эксперт по японскому языку и грамматике. На основе предоставленного описания создай подробное грамматическое правило.

ВАЖНЫЕ ПРАВИЛА:
1. Создай полное грамматическое правило на основе описания
2. Напиши подробный конспект правила на русском языке
3. Определи часть речи (используй только: Meishi, Daimeishi, Doushi, Keiyoushi, Keiyoudoushi, Fukushi, Rentaishi, Setsuzokushi, Joshi, Jodoushi, Kandoushi)
4. Создай 3-5 примеров использования правила
5. Создай 3-5 тестовых вопросов для проверки понимания
6. Все примеры должны быть на японском языке с переводом
7. Правило должно быть точным и полезным для изучающих японский язык

Описание правила:
{}

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{
  "title": "Название правила",
  "conspect": "Подробный конспект правила на русском языке",
  "part_of_speech": "Часть речи",
  "examples": [
    {{
      "title": "Заголовок примера",
      "content": "Японский текст примера",
      "description": "Объяснение примера на русском",
      "content_translation": "Перевод примера на русский"
    }}
  ],
  "tests": [
    {{
      "rus_description": "Описание задания на русском",
      "question_content": "Вопрос на японском",
      "answer": "Правильный ответ"
    }}
  ]
}}

Создай грамматическое правило:"#,
            rule_description
        );

        let messages = vec![LlmService::create_user_message(vec![
            LlmService::create_text_content(prompt)
        ])];

        let response: GrammarRuleResponse = self.llm_service.send_request(messages, 3000, 0.3).await?;
        info!("Successfully generated grammar rule: {}", response.title);
        Ok(response)
    }
}
