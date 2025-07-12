use crate::{
    config::Settings,
    llm::{ExtractedWord, LlmService, WordsResponse},
    word::{
        domain::set::{LearnSet, LearnSetState},
        set_repository::LearnSetRepository,
        word_release_repository::WordReleaseRepository,
    },
};
use anyhow::Result;
use std::collections::HashSet;
use tracing::{info, instrument};

pub struct SetService {
    set_repository: LearnSetRepository,
    release_repository: WordReleaseRepository,
    llm_service: LlmService,
    config: Settings,
}

impl SetService {
    pub fn new(
        set_repository: LearnSetRepository,
        release_repository: WordReleaseRepository,
        llm_service: LlmService,
        config: Settings,
    ) -> Self {
        Self {
            set_repository,
            release_repository,
            llm_service,
            config,
        }
    }

    #[instrument(skip(self, text))]
    pub async fn extract_words_from_text(&self, text: String) -> Result<Vec<ExtractedWord>> {
        info!("Extracting words from text");
        let prompt = self
            .config
            .prompts
            .extract_words_from_text
            .replace("{text}", &text);

        let response: WordsResponse = self.llm_service.send_request(&prompt, 0.1).await?;

        info!(
            "Successfully extracted {} words from text",
            response.words.len()
        );
        Ok(response.words)
    }

    #[instrument(skip(self, image_data))]
    pub async fn extract_words_from_image(
        &self,
        image_data: Vec<u8>,
    ) -> Result<Vec<ExtractedWord>> {
        info!("Extracting words from image");
        let prompt = &self.config.prompts.extract_words_from_image;

        let response: WordsResponse = self
            .llm_service
            .send_image_request(prompt, &image_data, 0.1)
            .await?;

        info!(
            "Successfully extracted {} words from image",
            response.words.len()
        );
        Ok(response.words)
    }

    #[instrument(skip(self, words), fields(user_login = %user_login))]
    pub async fn save_extracted_words(
        &self,
        user_login: &str,
        words: Vec<ExtractedWord>,
        skip_uniq: bool,
    ) -> Result<()> {
        info!("Saving {} words for user {}", words.len(), user_login);
        if words.is_empty() {
            info!("No words to save for user {}", user_login);
            return Ok(());
        }

        let unique_words: Vec<ExtractedWord> = match skip_uniq {
            true => words,
            false => {
                let mut existing_words = HashSet::new();
                let all_sets = self.set_repository.list_all(user_login).await?;
                for set in all_sets {
                    for card in set.words() {
                        existing_words.insert(card.word().to_string());
                    }
                }
                words
                    .into_iter()
                    .filter(|word| !existing_words.contains(&word.word))
                    .collect()
            }
        };

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
            .list_all(user_login)
            .await?
            .into_iter()
            .filter_map(|x| {
                if x.state() == &LearnSetState::Tobe {
                    Some(x.id().to_owned())
                } else {
                    None
                }
            })
            .collect::<Vec<_>>();

        let mut current_set = if current_ids.is_empty() {
            info!("Creating new set for user {}", user_login);
            LearnSet::new()
        } else {
            current_ids.sort_by(|a, b| b.cmp(a));
            let latest_id = current_ids.first().cloned().unwrap_or_default();

            info!("Loading existing set {} for user {}", latest_id, user_login);
            let set = self.set_repository.load(user_login, &latest_id).await?;

            if set.is_writabe() {
                set
            } else {
                info!(
                    "Creating new set for user {} as current set is not writable",
                    user_login
                );
                LearnSet::new()
            }
        };

        for word_data in unique_words {
            if !current_set.is_writabe() {
                info!(
                    "Saving current set and creating new one for user {}",
                    user_login
                );
                self.set_repository.save(user_login, &current_set).await?;
                current_set = LearnSet::new();
            }

            current_set.push(word_data.word, word_data.translation)?;
        }

        info!("Saving final set for user {}", user_login);
        self.set_repository.save(user_login, &current_set).await?;
        info!("Successfully saved all words for user {}", user_login);
        Ok(())
    }

    #[instrument(skip(self), fields(user_login = %user_login, set_id = %set_id))]
    pub async fn to_next_iter(&self, user_login: &str, set_id: &str) -> Result<()> {
        info!(
            "Move to next iter set {} as current for user {}",
            set_id, user_login
        );
        let mut card_set = self.set_repository.load(user_login, set_id).await?;

        let release = card_set.iter();
        if let Some(release) = release {
            self.set_repository.remove(user_login, set_id).await?;
            self.release_repository.save(user_login, &release).await?;
        } else {
            self.set_repository.save(user_login, &card_set).await?;
        }

        info!(
            "Successfully moved to next set {} as current for user {}",
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
                translation: word.translation().to_owned(),
            })
            .collect();

        self.save_extracted_words(user_login, extracted_words, true)
            .await?;
        self.release_repository
            .remove_word_by_ids(user_login, &word_ids)
            .await?;

        info!("Successfully marked words as tobe for user {}", user_login);
        Ok(())
    }
}
