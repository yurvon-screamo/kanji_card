use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use utoipa::ToSchema;

pub mod set;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, PartialEq, Eq, Hash)]
pub enum JapanesePartOfSpeech {
    Meishi,       // Существительное (名詞): обозначает предметы, людей, места
    Koyuumeishi,  // Имя собственное (固有名詞): имена людей, мест, организаций
    Daimeishi,    // Местоимение (代名詞): заменяет существительные
    Doushi,       // Глагол (動詞): обозначает действия или состояния
    Keiyoushi,    // Прилагательное (形容詞): описывает свойства, спрягается
    Keiyoudoushi, // Наречное прилагательное (形容動詞): описывает свойства, требует な
    Fukushi,      // Наречие (副詞): модифицирует глаголы, прилагательные
    Rentaishi,    // Преноминальный модификатор (連体詞): модифицирует существительные
    Setsuzokushi, // Союз (接続詞): связывает слова или предложения
    Joshi,        // Частица (助詞): грамматический маркер
    Jodoushi,     // Вспомогательный глагол (助動詞): выражает грамматические категории
    Kandoushi,    // Междометие (感動詞): выражает эмоции
    Suushi,       // Числительное/счетное слово (数詞): числа и счетчики
    Settoushi,    // Префикс (接頭詞): приставка к словам
    Setsubiji,    // Суффикс (接尾詞): окончание слов
    Kanyogo,      // Устойчивое выражение (慣用語): часто используемое сочетание слов
    Gitaigo,      // Звукоподражание (擬態語): имитация звуков и состояний
    Other,        // Другое: для редких или неопределенных случаев
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WordCard {
    id: String,
    word: String,
    translation: String,
    release_timestamp: Option<DateTime<Utc>>,
    part_of_speech: Option<JapanesePartOfSpeech>,
}

impl WordCard {
    pub fn new(word: &str, translation: &str, part_of_speech: &JapanesePartOfSpeech) -> Self {
        let word = word.trim().to_owned();
        let translation = translation.trim().to_owned();

        Self {
            id: Ulid::new().to_string(),
            word,
            translation,
            part_of_speech: Some(part_of_speech.to_owned()),
            release_timestamp: None,
        }
    }

    pub fn mark_as_release(&mut self) -> anyhow::Result<()> {
        if self.release_timestamp.is_some() {
            return Err(anyhow::anyhow!("WordCard is already released"));
        }

        self.release_timestamp = Some(Utc::now());
        Ok(())
    }

    pub fn mark_as_unknown(&mut self) -> anyhow::Result<()> {
        if self.release_timestamp.is_none() {
            return Err(anyhow::anyhow!("WordCard not released"));
        }

        self.release_timestamp = None;
        Ok(())
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

    pub fn part_of_speech(&self) -> Option<&JapanesePartOfSpeech> {
        self.part_of_speech.as_ref()
    }
}
