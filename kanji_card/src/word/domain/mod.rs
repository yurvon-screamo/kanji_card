use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ulid::Ulid;

pub mod set;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WordCard {
    id: String,

    word: String,
    translation: String,

    release_timestamp: Option<DateTime<Utc>>,
}

impl WordCard {
    pub fn new(word: String, translation: String) -> Self {
        let word = word.trim().to_owned();
        let translation = translation.trim().to_owned();

        Self {
            id: Ulid::new().to_string(),
            word,
            translation,
            release_timestamp: None,
        }
    }

    pub fn reading(&self) -> String {
        kakasi::convert(&self.word).hiragana
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn word(&self) -> &str {
        &self.word
    }

    pub fn translation(&self) -> &str {
        &self.translation
    }

    pub fn release_timestamp(&self) -> Option<chrono::DateTime<chrono::Utc>> {
        self.release_timestamp
    }
}
