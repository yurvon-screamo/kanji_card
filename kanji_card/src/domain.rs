use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize)]
pub struct CardSet {
    id: String,
    state: SetState,
    words: Vec<Card>,
    story: Option<Story>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Story {
    pub id: String,
    story: Vec<String>,
    story_transalte: Vec<String>,
    #[serde(default)]
    story_reading: Vec<String>,
}

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum SetState {
    Tobe,
    Current,
}

#[derive(Debug, Serialize, Deserialize)]
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

    pub fn recreate_story(&mut self) {
        if self.story.is_none() {
            return;
        }

        let mut reading = vec![];
        for s in self.story.as_ref().unwrap().story() {
            reading.push(to_reading(s).unwrap_or(s.to_owned()));
        }

        self.story = Some(Story {
            id: Ulid::new().to_string(),
            story_reading: reading,
            story: self.story.as_ref().unwrap().story().to_owned(),
            story_transalte: self.story.as_ref().unwrap().story_translate().to_owned(),
        });
    }

    pub fn put_story(&mut self, story: &[String], story_transalte: &[String]) -> Result<()> {
        if self.story.is_some() {
            return Err(anyhow!("Story already exists"));
        }

        if self.state == SetState::Current {
            return Err(anyhow!("State is current"));
        }

        let mut reading = vec![];
        for s in story {
            reading.push(to_reading(s).unwrap_or(s.to_owned()));
        }

        self.story = Some(Story {
            id: Ulid::new().to_string(),
            story: story.to_owned(),
            story_reading: reading,
            story_transalte: story_transalte.to_owned(),
        });
        Ok(())
    }

    pub fn push(&mut self, word: String, translation: String) -> Result<()> {
        if !self.is_writabe() {
            return Err(anyhow!("Set is not writable"));
        }

        let word = word.trim().to_owned();
        let translation = translation.trim().to_owned();

        let reading = to_reading(&word);

        self.words.push(Card {
            id: Ulid::new().to_string(),
            reading,
            word,
            translation,
        });

        Ok(())
    }
}

fn to_reading(word: &str) -> Option<String> {
    let hiragana = kakasi::convert(word).hiragana;
    if hiragana == word {
        None
    } else {
        Some(hiragana)
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

    pub fn story_reading(&self) -> &[String] {
        &self.story_reading
    }
}
