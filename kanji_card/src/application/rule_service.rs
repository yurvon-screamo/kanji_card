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

        let llm_response = self
            .llm_service
            .extract_grammar_rule_from_text(japanese_text)
            .await?;

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

        let llm_response = self
            .llm_service
            .generate_grammar_rule_from_description(rule_description)
            .await?;

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
}
