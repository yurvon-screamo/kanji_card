use anyhow::anyhow;
use std::path::PathBuf;
use tokio::fs;

use crate::word::domain::set::LearnSet;

const STORAGE_DIR: &str = "data/cardsets";

#[derive(Clone)]
pub struct LearnSetRepository {
    storage_dir: PathBuf,
}

impl LearnSetRepository {
    pub async fn new() -> anyhow::Result<Self> {
        let storage_dir = PathBuf::from(STORAGE_DIR);
        fs::create_dir_all(&storage_dir).await?;

        let repository = Self { storage_dir };
        Ok(repository)
    }

    fn get_user_path(&self, user_login: &str) -> PathBuf {
        self.storage_dir.join(user_login)
    }

    pub async fn remove_set(&self, user_login: &str, card_set_id: &str) -> anyhow::Result<()> {
        fs::remove_file(
            self.get_user_path(user_login)
                .join(format!("{card_set_id}.json")),
        )
        .await?;
        Ok(())
    }

    pub async fn save_set(&self, user_login: &str, card_set: &LearnSet) -> anyhow::Result<()> {
        let json = serde_json::to_string_pretty(card_set)?;
        let file_path = self
            .get_user_path(user_login)
            .join(format!("{}.json", card_set.id()));
        fs::write(file_path, json).await?;
        Ok(())
    }

    pub async fn load_set(&self, user_login: &str, id: &str) -> anyhow::Result<LearnSet> {
        let file_path = self.get_user_path(user_login).join(format!("{id}.json"));
        if file_path.exists() {
            Ok(serde_json::from_str(&fs::read_to_string(file_path).await?)?)
        } else {
            Err(anyhow!("Card set not found"))
        }
    }

    pub async fn list_ids(&self, user_login: &str) -> anyhow::Result<Vec<String>> {
        let mut ids = Vec::new();
        let state_dir = self.get_user_path(user_login);

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
}
