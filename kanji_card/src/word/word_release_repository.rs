use anyhow::anyhow;
use std::path::PathBuf;
use tokio::fs;

use crate::word::domain::WordCard;

const WORD_STORAGE_DIR: &str = "data/release_word";

#[derive(Clone)]
pub struct WordReleaseRepository {
    word_storage_dir: PathBuf,
}

impl WordReleaseRepository {
    pub async fn new() -> anyhow::Result<Self> {
        let word_storage_dir = PathBuf::from(WORD_STORAGE_DIR);
        fs::create_dir_all(&word_storage_dir).await?;

        Ok(Self { word_storage_dir })
    }

    fn get_word_user_path(&self, user_login: &str) -> PathBuf {
        self.word_storage_dir.join(user_login)
    }

    pub async fn remove_word(&self, user_login: &str, card_id: &str) -> anyhow::Result<()> {
        let file_path = self
            .get_word_user_path(user_login)
            .join(format!("{card_id}.json"));

        fs::remove_file(file_path).await?;
        Ok(())
    }

    pub async fn remove_word_by_ids(&self, user_login: &str, ids: &[String]) -> anyhow::Result<()> {
        for id in ids {
            self.remove_word(user_login, id).await?;
        }
        Ok(())
    }

    pub async fn update_word(&self, user_login: &str, card: &WordCard) -> anyhow::Result<()> {
        let word_json = serde_json::to_string_pretty(card)?;
        let word_dir = self.get_word_user_path(user_login);
        fs::create_dir_all(&word_dir).await?;
        let word_file_path = word_dir.join(format!("{}.json", card.id()));
        fs::write(word_file_path, word_json).await?;
        Ok(())
    }

    pub async fn save(&self, user_login: &str, cards: &[WordCard]) -> anyhow::Result<()> {
        for card in cards {
            let word_json = serde_json::to_string_pretty(card)?;

            let word_dir = self.get_word_user_path(user_login);
            fs::create_dir_all(&word_dir).await?;

            let word_file_path = word_dir.join(format!("{}.json", card.id()));
            fs::write(word_file_path, word_json).await?;
        }

        Ok(())
    }

    pub async fn load_word(&self, user_login: &str, id: &str) -> anyhow::Result<WordCard> {
        let file_path = self
            .get_word_user_path(user_login)
            .join(format!("{id}.json"));
        if file_path.exists() {
            let json = fs::read_to_string(file_path).await?;
            return Ok(serde_json::from_str(&json)?);
        }
        Err(anyhow!("Card not found"))
    }

    pub async fn list_word_ids(&self, user_login: &str) -> anyhow::Result<Vec<String>> {
        let mut ids = Vec::new();
        let state_dir = self.get_word_user_path(user_login);

        fs::create_dir_all(&state_dir).await?;
        let mut entries = fs::read_dir(state_dir).await?;

        while let Some(entry) = entries.next_entry().await? {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.ends_with(".json") {
                    ids.push(file_name.trim_end_matches(".json").to_string());
                }
            }
        }

        Ok(ids)
    }

    pub async fn load_word_by_ids(
        &self,
        user_login: &str,
        ids: &[String],
    ) -> anyhow::Result<Vec<WordCard>> {
        let mut cards = Vec::new();
        for id in ids {
            if let Ok(card) = self.load_word(user_login, id).await {
                cards.push(card);
            }
        }
        Ok(cards)
    }

    pub async fn list_all_words(&self, user_login: &str) -> anyhow::Result<Vec<WordCard>> {
        let ids = self.list_word_ids(user_login).await?;
        let mut all_cards = Vec::new();

        for id in ids {
            if let Ok(card) = self.load_word(user_login, &id).await {
                all_cards.push(card);
            }
        }

        Ok(all_cards)
    }
}
