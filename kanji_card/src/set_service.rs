use crate::domain::{CardSet, SetState};
use crate::llm::{ExtractedWord, LlmService};
use crate::release_repository::ReleaseRepository;
use crate::set_repository::CardSetRepository;
use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};
use std::collections::HashSet;

pub struct SetService {
    set_repository: CardSetRepository,
    release_repository: ReleaseRepository,
    llm_service: LlmService,
}

impl SetService {
    pub fn new(
        set_repository: CardSetRepository,
        release_repository: ReleaseRepository,
        llm_service: LlmService,
    ) -> Self {
        Self {
            set_repository,
            release_repository,
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

        let all_sets = self.set_repository.list_all(user_login).await?;
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
            .set_repository
            .list_ids(user_login, &SetState::Tobe)
            .await?;
        let mut current_set = if current_ids.is_empty() {
            CardSet::new()
        } else {
            current_ids.sort_by(|a, b| b.cmp(a));
            let latest_id = current_ids.first().unwrap();
            let set = self.set_repository.load(user_login, latest_id).await?;

            if set.is_writabe() {
                set
            } else {
                CardSet::new()
            }
        };

        for word_data in unique_words {
            if !current_set.is_writabe() {
                self.set_repository.save(user_login, &current_set).await?;
                current_set = CardSet::new();
            }

            current_set.push(word_data.word, word_data.reading, word_data.translation)?;
        }

        self.set_repository.save(user_login, &current_set).await?;
        Ok(())
    }

    pub async fn mark_as_current(&self, user_login: &str, set_id: &str) -> Result<()> {
        let mut card_set = self.set_repository.load(user_login, set_id).await?;
        card_set.as_current()?;
        self.set_repository.save(user_login, &card_set).await?;
        Ok(())
    }

    pub async fn release_set(&self, user_login: &str, set_id: &str) -> Result<()> {
        let card_set = self.set_repository.load(user_login, set_id).await?;
        let words = card_set.release()?;

        self.set_repository.remove(user_login, &set_id).await?;
        self.release_repository.save(user_login, &words).await?;

        Ok(())
    }

    pub async fn mark_as_tobe(&self, user_login: &str, word_ids: Vec<String>) -> Result<()> {
        let extracted_words = self
            .release_repository
            .load_by_ids(user_login, &word_ids)
            .await?
            .into_iter()
            .map(|word| ExtractedWord {
                word: word.word().to_owned(),
                reading: word.reading().map(|x| x.to_owned()),
                translation: word.translation().to_owned(),
            })
            .collect();

        self.save_words(user_login, extracted_words).await?;
        self.release_repository
            .remove_by_ids(user_login, &word_ids)
            .await?;

        Ok(())
    }
}
