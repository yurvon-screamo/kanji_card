use crate::word::{domain::set::LearnSet, set_repository::LearnSetRepository};
use anyhow::Result;
use tracing::{info, instrument};

use super::word_repository::WordRepository;

pub struct SetService {
    set_repository: LearnSetRepository,
    word_repository: WordRepository,
}

impl SetService {
    pub fn new(set_repository: LearnSetRepository, word_repository: WordRepository) -> Self {
        Self {
            set_repository,
            word_repository,
        }
    }

    #[instrument(skip(self ), fields(user_login = %user_login))]
    pub async fn build_new_set(&self, user_login: &str, set_size: usize) -> Result<()> {
        info!(
            "Marking set with len: {} for user: {}",
            set_size, user_login
        );

        let mut set_words = vec![];
        let exist_word_ids = self.word_repository.list_word_ids(user_login).await?;
        for id in exist_word_ids {
            let word = self.word_repository.load_word(user_login, &id).await?;
            if word.release_timestamp().is_none() {
                set_words.push(word);
            }
        }

        let card_set = LearnSet::new(set_words);
        self.set_repository.save_set(user_login, &card_set).await?;

        for word in card_set.words() {
            self.word_repository
                .remove_word(user_login, &word.id())
                .await?;
        }

        info!("Successfully created set for user {}", user_login);
        Ok(())
    }

    #[instrument(skip(self), fields(user_login = %user_login, set_id = %set_id))]
    pub async fn to_next_iter(&self, user_login: &str, set_id: &str) -> Result<()> {
        info!(
            "Move to next iter set {} as current for user {}",
            set_id, user_login
        );
        let mut card_set = self.set_repository.load_set(user_login, set_id).await?;

        if let Some(words) = card_set.upgrade()? {
            self.set_repository.remove_set(user_login, set_id).await?;
            for word in words {
                self.word_repository.save_word(user_login, &word).await?;
            }
        } else {
            self.set_repository.save_set(user_login, &card_set).await?;
        }

        info!(
            "Successfully moved to next set {} as current for user {}",
            set_id, user_login
        );
        Ok(())
    }
}
