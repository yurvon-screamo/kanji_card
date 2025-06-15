use crate::domain::{CardSet, SetState};
use crate::llm::{ExtractedWord, LlmService};
use crate::repository::CardSetRepository;
use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};
use std::collections::HashSet;

pub struct SetService {
    repository: CardSetRepository,
    llm_service: LlmService,
}

impl SetService {
    pub fn new(repository: CardSetRepository, llm_service: LlmService) -> Self {
        Self {
            repository,
            llm_service,
        }
    }

    pub async fn extract_words_from_text(&self, text: String) -> Result<Vec<ExtractedWord>> {
        let words = self.llm_service.extract_words_from_text(&text).await?;
        Ok(words.into_iter().map(ExtractedWord::from).collect())
    }

    pub async fn extract_words_from_image(
        &self,
        image_data: Vec<u8>,
    ) -> Result<Vec<ExtractedWord>> {
        let image_base64 = general_purpose::STANDARD.encode(&image_data);
        let words = self
            .llm_service
            .extract_words_from_image(&image_base64)
            .await?;
        Ok(words.into_iter().map(ExtractedWord::from).collect())
    }

    pub async fn save_words(&self, user_login: &str, words: Vec<ExtractedWord>) -> Result<()> {
        if words.is_empty() {
            return Ok(());
        }

        let all_sets = self.repository.list_all(user_login).await?;
        let mut existing_words = HashSet::new();
        for set in all_sets {
            for card in set.words() {
                existing_words.insert(card.word().to_string());
            }
        }

        let unique_words: Vec<ExtractedWord> = words
            .into_iter()
            .filter(|word| !existing_words.contains(&word.word))
            .collect();

        if unique_words.is_empty() {
            return Ok(());
        }

        let mut current_ids = self
            .repository
            .list_ids(user_login, &SetState::Tobe)
            .await?;
        let mut current_set = if current_ids.is_empty() {
            CardSet::new()
        } else {
            current_ids.sort_by(|a, b| b.cmp(a));
            let latest_id = current_ids.first().unwrap();
            let set = self.repository.load(user_login, latest_id).await?;

            if set.is_writabe() {
                set
            } else {
                CardSet::new()
            }
        };

        for word_data in unique_words {
            if !current_set.is_writabe() {
                self.repository.save(user_login, &current_set).await?;
                current_set = CardSet::new();
            }

            current_set.push(word_data.word, word_data.reading, word_data.translation)?;
        }

        self.repository.save(user_login, &current_set).await?;
        Ok(())
    }

    pub async fn mark_as_current(&self, user_login: &str, set_id: &str) -> Result<()> {
        let mut card_set = self.repository.load(user_login, set_id).await?;
        card_set.as_current()?;
        self.repository.save(user_login, &card_set).await?;
        Ok(())
    }

    pub async fn mark_as_finished(&self, user_login: &str, set_id: &str) -> Result<()> {
        let mut card_set = self.repository.load(user_login, set_id).await?;
        card_set.as_finished()?;
        self.repository.save(user_login, &card_set).await?;
        Ok(())
    }

    pub async fn mark_as_tobe(&self, user_login: &str, set_id: &str) -> Result<()> {
        let mut card_set = self.repository.load(user_login, set_id).await?;
        card_set.as_tobe();
        self.repository.save(user_login, &card_set).await?;
        Ok(())
    }
}
