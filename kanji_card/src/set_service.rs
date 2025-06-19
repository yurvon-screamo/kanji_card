use crate::domain::{CardSet, SetState};
use crate::llm::{ExtractedWord, LlmService};
use crate::release_repository::ReleaseRepository;
use crate::set_repository::CardSetRepository;
use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};
use std::collections::HashSet;
use tracing::{error, info, instrument};

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

    #[instrument(skip(self, text))]
    pub async fn extract_words_from_text(&self, text: String) -> Result<Vec<ExtractedWord>> {
        info!("Extracting words from text");
        let words = self.llm_service.extract_words_from_text(&text).await?;
        info!("Successfully extracted {} words from text", words.len());
        Ok(words.into_iter().collect())
    }

    #[instrument(skip(self, image_data))]
    pub async fn extract_words_from_image(
        &self,
        image_data: Vec<u8>,
    ) -> Result<Vec<ExtractedWord>> {
        info!("Extracting words from image");
        let image_base64 = general_purpose::STANDARD.encode(&image_data);
        let words = self
            .llm_service
            .extract_words_from_image(&image_base64)
            .await?;
        info!("Successfully extracted {} words from image", words.len());
        Ok(words.into_iter().collect())
    }

    #[instrument(skip(self, words), fields(user_login = %user_login))]
    pub async fn save_words(&self, user_login: &str, words: Vec<ExtractedWord>) -> Result<()> {
        info!("Saving {} words for user {}", words.len(), user_login);
        if words.is_empty() {
            info!("No words to save for user {}", user_login);
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
            info!("No unique words to save for user {}", user_login);
            return Ok(());
        }

        info!(
            "Found {} unique words to save for user {}",
            unique_words.len(),
            user_login
        );

        let mut current_ids = self
            .set_repository
            .list_ids(user_login, &SetState::Tobe)
            .await?;
        let mut current_set = if current_ids.is_empty() {
            info!("Creating new set for user {}", user_login);
            CardSet::new()
        } else {
            current_ids.sort_by(|a, b| b.cmp(a));
            let latest_id = current_ids.first().unwrap();
            info!("Loading existing set {} for user {}", latest_id, user_login);
            let set = self.set_repository.load(user_login, latest_id).await?;

            if set.is_writabe() {
                set
            } else {
                info!(
                    "Creating new set for user {} as current set is not writable",
                    user_login
                );
                CardSet::new()
            }
        };

        for word_data in unique_words {
            if !current_set.is_writabe() {
                match self.llm_service.generate_story(current_set.words()).await {
                    Ok((story, story_translate)) => {
                        if let Err(e) = current_set.put_story(story, story_translate) {
                            error!("Failed to put story to set: {:?}", e);
                        } else {
                            info!("Successfully generated and added story to set");
                        }
                    }
                    Err(e) => {
                        error!("Failed to generate story for set: {:?}", e);
                    }
                }

                info!(
                    "Saving current set and creating new one for user {}",
                    user_login
                );
                self.set_repository.save(user_login, &current_set).await?;
                current_set = CardSet::new();
            }

            current_set.push(word_data.word, word_data.reading, word_data.translation)?;
        }

        if !current_set.is_writabe() {
            match self.llm_service.generate_story(current_set.words()).await {
                Ok((story, story_translate)) => {
                    if let Err(e) = current_set.put_story(story, story_translate) {
                        error!("Failed to put story to final set: {:?}", e);
                    } else {
                        info!("Successfully generated and added story to final set");
                    }
                }
                Err(e) => {
                    error!("Failed to generate story for final set: {:?}", e);
                }
            }
        }

        info!("Saving final set for user {}", user_login);
        self.set_repository.save(user_login, &current_set).await?;
        info!("Successfully saved all words for user {}", user_login);
        Ok(())
    }

    #[instrument(skip(self), fields(user_login = %user_login, set_id = %set_id))]
    pub async fn mark_as_current(&self, user_login: &str, set_id: &str) -> Result<()> {
        info!("Marking set {} as current for user {}", set_id, user_login);
        let mut card_set = self.set_repository.load(user_login, set_id).await?;
        card_set.as_current()?;
        self.set_repository.save(user_login, &card_set).await?;
        info!(
            "Successfully marked set {} as current for user {}",
            set_id, user_login
        );
        Ok(())
    }

    #[instrument(skip(self), fields(user_login = %user_login, set_id = %set_id))]
    pub async fn release_set(&self, user_login: &str, set_id: &str) -> Result<()> {
        info!("Releasing set {} for user {}", set_id, user_login);
        let card_set = self.set_repository.load(user_login, set_id).await?;
        let set_release = card_set.release()?;

        self.set_repository.remove(user_login, set_id).await?;
        self.release_repository
            .save(user_login, &set_release.words, &set_release.story)
            .await?;

        info!(
            "Successfully released set {} for user {}",
            set_id, user_login
        );
        Ok(())
    }

    #[instrument(skip(self, word_ids), fields(user_login = %user_login))]
    pub async fn mark_as_tobe(&self, user_login: &str, word_ids: Vec<String>) -> Result<()> {
        info!(
            "Marking {} words as tobe for user {}",
            word_ids.len(),
            user_login
        );
        let extracted_words = self
            .release_repository
            .load_word_by_ids(user_login, &word_ids)
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

        info!("Successfully marked words as tobe for user {}", user_login);
        Ok(())
    }
}
