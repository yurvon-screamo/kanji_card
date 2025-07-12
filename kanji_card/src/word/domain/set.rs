use anyhow::{Result, anyhow};
use chrono::{DateTime, Days, Utc};
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use utoipa::ToSchema;

use crate::word::domain::WordCard;

#[derive(Debug, Serialize, Deserialize)]
pub struct LearnSet {
    id: String,
    state: LearnSetState,
    words: Vec<WordCard>,
    state_timestamp: Option<DateTime<Utc>>,
}

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum LearnSetState {
    Tobe,
    #[serde(rename = "Current")]
    OneDay,
    TwoDay,
    ThreeDay,
    FiveDay,
    SevenDay,
    TenDay,
}

const MAX_SET_LEN: usize = 8;

impl LearnSet {
    pub fn new() -> Self {
        Self {
            id: Ulid::new().to_string(),
            state: LearnSetState::Tobe,
            words: vec![],
            state_timestamp: None,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn time_to_learn(&self) -> Option<DateTime<Utc>> {
        self.state_timestamp.map(|x| match &self.state {
            LearnSetState::Tobe => x,
            LearnSetState::OneDay => x.checked_add_days(Days::new(1)).unwrap_or_default(),
            LearnSetState::TwoDay => x.checked_add_days(Days::new(2)).unwrap_or_default(),
            LearnSetState::ThreeDay => x.checked_add_days(Days::new(3)).unwrap_or_default(),
            LearnSetState::FiveDay => x.checked_add_days(Days::new(5)).unwrap_or_default(),
            LearnSetState::SevenDay => x.checked_add_days(Days::new(7)).unwrap_or_default(),
            LearnSetState::TenDay => x.checked_add_days(Days::new(10)).unwrap_or_default(),
        })
    }

    pub fn need_to_learn(&self) -> bool {
        let time_to_learn = self.time_to_learn();
        match time_to_learn {
            Some(x) => x <= Utc::now(),
            None => false,
        }
    }

    pub fn state(&self) -> &LearnSetState {
        &self.state
    }

    pub fn words(&self) -> &[WordCard] {
        &self.words
    }

    pub fn iter(&mut self) -> Option<Vec<WordCard>> {
        self.state_timestamp = Some(Utc::now());
        self.state = match &self.state {
            LearnSetState::Tobe => LearnSetState::OneDay,
            LearnSetState::OneDay => LearnSetState::TwoDay,
            LearnSetState::TwoDay => LearnSetState::ThreeDay,
            LearnSetState::ThreeDay => LearnSetState::FiveDay,
            LearnSetState::FiveDay => LearnSetState::SevenDay,
            LearnSetState::SevenDay | LearnSetState::TenDay => LearnSetState::TenDay,
        };

        if self.state == LearnSetState::TenDay {
            let mut words = vec![];
            for word in self.words.iter() {
                let mut word = word.clone();
                word.release_timestamp = Some(Utc::now());
                words.push(word);
            }
            Some(words)
        } else {
            None
        }
    }

    pub fn is_writabe(&self) -> bool {
        self.words.len() < MAX_SET_LEN && self.state == LearnSetState::Tobe
    }

    pub fn push(&mut self, word: String, translation: String) -> Result<()> {
        if !self.is_writabe() {
            return Err(anyhow!("Set is not writable"));
        }

        self.words.push(WordCard::new(word, translation));
        Ok(())
    }
}
