use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize)]
pub struct CardSet {
    id: String,
    state: SetState,
    words: Vec<Card>,

    story: Option<Story>,
}

#[derive(Serialize, Deserialize)]
pub struct Story {
    id: String,
    story: Vec<String>,
    story_transalte: Vec<String>,
}

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum SetState {
    Tobe,
    Current,
}

#[derive(Serialize, Deserialize)]
pub struct Card {
    id: String,
    word: String,
    reading: Option<String>,
    translation: String,
}

pub struct SetRelease {
    pub words: Vec<Card>,
    pub story: Option<Story>,
}

const MAX_SET_LEN: usize = 8;

impl CardSet {
    pub fn new() -> Self {
        Self {
            id: Ulid::new().to_string(),
            state: SetState::Tobe,
            words: vec![],
            story: None,
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

    pub fn story(&self) -> Option<&Story> {
        self.story.as_ref()
    }

    pub fn as_current(&mut self) -> Result<()> {
        if self.state != SetState::Tobe {
            return Err(anyhow!("State is not tobe"));
        }

        self.state = SetState::Current;
        Ok(())
    }

    pub fn release(self) -> Result<SetRelease> {
        if self.state != SetState::Current {
            return Err(anyhow!("State is not current"));
        }

        Ok(SetRelease {
            words: self.words,
            story: self.story,
        })
    }

    pub fn is_writabe(&self) -> bool {
        self.words.len() < MAX_SET_LEN && self.state == SetState::Tobe
    }

    pub fn put_story(&mut self, story: Vec<String>, story_transalte: Vec<String>) -> Result<()> {
        if self.story.is_some() {
            return Err(anyhow!("Story already exists"));
        }

        if self.state == SetState::Current {
            return Err(anyhow!("State is current"));
        }

        self.story = Some(Story {
            id: Ulid::new().to_string(),
            story,
            story_transalte,
        });
        Ok(())
    }

    pub fn push(
        &mut self,
        word: String,
        reading: Option<String>,
        translation: String,
    ) -> Result<()> {
        if !self.is_writabe() {
            return Err(anyhow!("Set is not writable"));
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

impl Story {
    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn story(&self) -> &[String] {
        &self.story
    }

    pub fn story_translate(&self) -> &[String] {
        &self.story_transalte
    }
}
