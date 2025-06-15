use crate::domain::Card;
use anyhow::anyhow;
use std::path::PathBuf;
use tokio::fs;

const STORAGE_DIR: &str = "data/release";

#[derive(Clone)]
pub struct ReleaseRepository {
    storage_dir: PathBuf,
}

impl ReleaseRepository {
    pub async fn new() -> anyhow::Result<Self> {
        let storage_dir = PathBuf::from(STORAGE_DIR);
        fs::create_dir_all(&storage_dir).await?;

        let repository = Self { storage_dir };
        Ok(repository)
    }

    fn get_user_path(&self, user_login: &str) -> PathBuf {
        self.storage_dir.join(user_login)
    }

    pub async fn remove(&self, user_login: &str, card_set_id: &str) -> anyhow::Result<()> {
        let file_path = self
            .get_user_path(user_login)
            .join(format!("{}.json", card_set_id));

        fs::remove_file(file_path).await?;
        Ok(())
    }

    pub async fn save(&self, user_login: &str, cards: &[Card]) -> anyhow::Result<()> {
        for card in cards {
            let json = serde_json::to_string_pretty(card)?;
            let file_path = self
                .get_user_path(user_login)
                .join(format!("{}.json", card.id()));

            fs::write(file_path, json).await?;
        }
        Ok(())
    }

    pub async fn load(&self, user_login: &str, id: &str) -> anyhow::Result<Card> {
        let file_path = self.get_user_path(user_login).join(format!("{}.json", id));
        if file_path.exists() {
            let json = fs::read_to_string(file_path).await?;
            return Ok(serde_json::from_str(&json)?);
        }
        Err(anyhow!("Card set not found"))
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

    pub async fn list_all(&self, user_login: &str) -> anyhow::Result<Vec<Card>> {
        let ids = self.list_ids(user_login).await?;
        let mut all_sets = Vec::new();

        for id in ids {
            if let Ok(set) = self.load(user_login, &id).await {
                all_sets.push(set);
            }
        }

        Ok(all_sets)
    }
}
