use crate::{
    config::Settings,
    llm::{ExtractedWord, LlmService, WordsResponse},
    word::{domain::WordCard, set_repository::LearnSetRepository, word_repository::WordRepository},
};
use anyhow::Result;
use std::collections::HashSet;
use tracing::{info, instrument};

pub struct WordCreator {
    set_repository: LearnSetRepository,
    word_repository: WordRepository,
    llm_service: LlmService,
    config: Settings,
}

impl WordCreator {
    pub fn new(
        set_repository: LearnSetRepository,
        word_repository: WordRepository,
        llm_service: LlmService,
        config: Settings,
    ) -> Self {
        Self {
            set_repository,
            word_repository,
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
    ) -> Result<()> {
        info!("Saving {} words for user {}", words.len(), user_login);
        if words.is_empty() {
            info!("No words to save for user {}", user_login);
            return Ok(());
        }

        let unique_words: HashSet<ExtractedWord> = {
            let mut existing_words = HashSet::<String>::new();
            for id in self.word_repository.list_word_ids(user_login).await? {
                let word = self.word_repository.load_word(user_login, &id).await?;
                existing_words.insert(word.word().to_string());
            }

            let all_set_ids = self.set_repository.list_ids(user_login).await?;
            for id in all_set_ids {
                let set = self.set_repository.load_set(user_login, &id).await?;
                for card in set.words() {
                    existing_words.insert(card.word().to_string());
                }
            }

            words
                .into_iter()
                .filter(|word| !existing_words.contains(&word.word))
                .collect()
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

        for word in unique_words {
            let word = WordCard::new(&word.word, &word.translation, &word.part_of_speech);
            self.word_repository.save_word(user_login, &word).await?;
        }

        info!("Successfully saved all words for user {}", user_login);
        Ok(())
    }
}
