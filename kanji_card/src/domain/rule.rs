use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize)]
pub struct GrammarRule {
    id: String,
    release_timestamp: Option<DateTime<Utc>>,

    title: String,
    description: String,
    part_of_speech: JapanesePartOfSpeech,

    examples: Vec<RuleExample>,
    tests: Vec<RuleTest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleExample {
    id: String,
    title: String,
    content: String,
    description: String,
    content_translation: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RuleTest {
    test_id: String,
    rus_description: String,
    question_content: String,
    answer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum JapanesePartOfSpeech {
    Meishi,       // Существительное (名詞): обозначает предметы, людей, места
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
}

impl GrammarRule {
    pub fn new(
        title: String,
        description: String,
        part_of_speech: JapanesePartOfSpeech,
        examples: Vec<RuleExample>,
        tests: Vec<RuleTest>,
    ) -> Self {
        Self {
            id: Ulid::new().to_string(),
            release_timestamp: None,
            title,
            description,
            part_of_speech,
            examples,
            tests,
        }
    }

    pub fn check_test(&self, test_id: &str, answer: &str) -> bool {
        let test = self.tests.iter().find(|test| test.test_id == test_id);
        if let Some(test) = test {
            test.answer == answer
        } else {
            false
        }
    }

    pub fn release(&mut self) {
        self.release_timestamp = Some(Utc::now());
    }

    pub fn is_released(&self) -> bool {
        self.release_timestamp.is_some()
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn description(&self) -> &str {
        &self.description
    }

    pub fn part_of_speech(&self) -> &JapanesePartOfSpeech {
        &self.part_of_speech
    }

    pub fn release_timestamp(&self) -> Option<DateTime<Utc>> {
        self.release_timestamp
    }

    pub fn examples(&self) -> &[RuleExample] {
        &self.examples
    }

    pub fn tests(&self) -> &[RuleTest] {
        &self.tests
    }
}

impl RuleExample {
    pub fn new(
        title: String,
        content: String,
        description: String,
        content_translation: String,
    ) -> Self {
        Self {
            id: Ulid::new().to_string(),
            title,
            content,
            description,
            content_translation,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn content(&self) -> &str {
        &self.content
    }

    pub fn description(&self) -> &str {
        &self.description
    }

    pub fn content_translation(&self) -> &str {
        &self.content_translation
    }
}

impl RuleTest {
    pub fn new(rus_description: String, question_content: String, answer: String) -> Self {
        Self {
            test_id: Ulid::new().to_string(),
            rus_description,
            question_content,
            answer,
        }
    }

    pub fn test_id(&self) -> &str {
        &self.test_id
    }

    pub fn rus_description(&self) -> &str {
        &self.rus_description
    }

    pub fn question_content(&self) -> &str {
        &self.question_content
    }

    pub fn answer(&self) -> &str {
        &self.answer
    }
}
