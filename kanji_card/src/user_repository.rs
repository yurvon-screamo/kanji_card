use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub password_hash: String,
}

pub struct UserRepository {
    base_path: PathBuf,
}

const STORAGE_DIR: &str = "data/users";

impl UserRepository {
    pub async fn new() -> anyhow::Result<Self> {
        let storage_dir = PathBuf::from(STORAGE_DIR);
        fs::create_dir_all(&storage_dir).await?;
        Ok(Self {
            base_path: storage_dir,
        })
    }

    pub async fn save_user(&self, login: &str, password_hash: &str) -> Result<()> {
        let user_path = self.base_path.join(format!("{}.json", login));
        let user = User {
            password_hash: password_hash.to_string(),
        };
        let content = serde_json::to_string_pretty(&user)?;
        fs::write(user_path, content).await?;
        Ok(())
    }

    pub async fn get_user(&self, login: &str) -> Result<Option<User>> {
        let user_path = self.base_path.join(format!("{}.json", login));
        if !user_path.exists() {
            return Ok(None);
        }
        let content = fs::read_to_string(user_path).await?;
        let user = serde_json::from_str(&content)?;
        Ok(Some(user))
    }
}
