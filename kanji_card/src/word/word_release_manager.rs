use crate::word::word_repository::WordRepository;
use anyhow::Result;
use tracing::{info, instrument};

pub struct WordReleaseManager {
    word_repository: WordRepository,
}

impl WordReleaseManager {
    pub fn new(word_repository: WordRepository) -> Self {
        Self { word_repository }
    }

    #[instrument(skip(self), fields(user_login = %user_login))]
    pub async fn unknown_word(&self, user_login: &str, word_id: &str) -> Result<()> {
        info!("Mark word as unknown for user {}", user_login);

        let mut word = self.word_repository.load_word(user_login, word_id).await?;
        word.mark_as_unknown()?;
        self.word_repository.save_word(user_login, &word).await?;

        info!(
            "Successfully marked word as unknown for user {}",
            user_login
        );
        Ok(())
    }
}
