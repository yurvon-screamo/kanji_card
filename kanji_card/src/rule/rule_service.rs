use crate::config::Settings;
use crate::llm::{GrammarRuleResponse, LlmService};
use crate::rule::rule::{GrammarRule, RuleExample, RuleTest};
use crate::rule_repository::RuleRepository;
use anyhow::Result;
use tracing::{info, instrument};

pub struct RuleService {
    rule_repository: RuleRepository,
    llm_service: LlmService,
    config: Settings,
}

impl RuleService {
    pub fn new(rule_repository: RuleRepository, llm_service: LlmService, config: Settings) -> Self {
        Self {
            rule_repository,
            llm_service,
            config,
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

        let part_of_speech = llm_response.part_of_speech;

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
            .generate_grammar_rule_from_description(rule_description)
            .await?;

        let part_of_speech = llm_response.part_of_speech;

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

    #[instrument(skip(self))]
    async fn extract_grammar_rule_from_text(
        &self,
        japanese_text: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Extracting grammar rule from Japanese text");

        let prompt = self
            .config
            .prompts
            .extract_grammar_rule_from_text
            .replace("{text}", japanese_text);

        let response: GrammarRuleResponse =
            self.llm_service.send_reasoning_request(&prompt).await?;
        info!("Successfully extracted grammar rule: {}", response.title);

        Ok(response)
    }

    #[instrument(skip(self))]
    async fn generate_grammar_rule_from_description(
        &self,
        rule_description: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Generating grammar rule from description");

        let prompt = self
            .config
            .prompts
            .generate_grammar_rule_from_description
            .replace("{description}", rule_description);

        let response: GrammarRuleResponse =
            self.llm_service.send_reasoning_request(&prompt).await?;
        info!("Successfully generated grammar rule: {}", response.title);

        Ok(response)
    }
}
