use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct CardSet {
    id: String,
    state: SetState,
    words: Vec<Card>,
}

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum SetState {
    Tobe,
    Current,
    Finished,
}

#[derive(Serialize, Deserialize)]
pub struct Card {
    id: String,
    word: String,
    reading: Option<String>,
    translation: String,
}

const MAX_SET_LEN: usize = 8;

impl CardSet {
    pub fn new() -> Self {
        Self {
            id: Ulid::new().to_string(),
            state: SetState::Tobe,
            words: vec![],
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn state(&self) -> &SetState {
        &self.state
    }

    pub fn words(&self) -> &[Card] {
        &self.words
    }

    pub fn as_tobe(&mut self) {
        self.state = SetState::Tobe;
    }

    pub fn as_current(&mut self) -> Result<()> {
        if self.state != SetState::Tobe {
            return Err(anyhow!("State is not tobe"));
        }

        self.state = SetState::Current;
        Ok(())
    }

    pub fn as_finished(&mut self) -> Result<()> {
        if self.state != SetState::Current {
            return Err(anyhow!("State is not current"));
        }

        self.state = SetState::Finished;
        Ok(())
    }

    pub fn is_writabe(&self) -> bool {
        self.words.len() < MAX_SET_LEN && self.state == SetState::Tobe
    }

    pub fn push(
        &mut self,
        word: String,
        reading: Option<String>,
        translation: String,
    ) -> Result<()> {
        if self.words.len() == MAX_SET_LEN {
            return Err(anyhow!("Max len"));
        }

        if self.state != SetState::Tobe {
            return Err(anyhow!("Not tobe"));
        }

        let reading = if Some(word.clone()) == reading {
            None
        } else {
            reading
        };

        self.words.push(Card {
            id: Ulid::new().to_string(),
            word,
            reading,
            translation,
        });
        Ok(())
    }
}

impl Card {
    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn word(&self) -> &str {
        &self.word
    }

    pub fn reading(&self) -> Option<&str> {
        self.reading.as_deref()
    }

    pub fn translation(&self) -> &str {
        &self.translation
    }
}
