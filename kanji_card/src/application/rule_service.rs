use crate::domain::rule::{GrammarRule, RuleExample, RuleTest};
use crate::llm::{GrammarRuleResponse, LlmService};
use crate::rule_repository::RuleRepository;
use anyhow::Result;
use tracing::{info, instrument};

pub struct RuleService {
    rule_repository: RuleRepository,
    llm_service: LlmService,
}

impl RuleService {
    pub fn new(rule_repository: RuleRepository, llm_service: LlmService) -> Self {
        Self {
            rule_repository,
            llm_service,
        }
    }

    #[instrument(skip(self, japanese_text))]
    pub async fn create_from_text(
        &self,
        user_login: &str,
        japanese_text: &str,
    ) -> Result<GrammarRule> {
        info!("Creating grammar rule from Japanese text");

        let llm_response = self.extract_grammar_rule_from_text(japanese_text).await?;

        let part_of_speech = llm_response.part_of_speech;

        let examples: Vec<RuleExample> = llm_response
            .examples
            .into_iter()
            .map(|ex| {
                RuleExample::new(ex.title, ex.content, ex.description, ex.content_translation)
            })
            .collect();

        let tests: Vec<RuleTest> = llm_response
            .tests
            .into_iter()
            .map(|test| RuleTest::new(test.rus_description, test.question_content, test.answer))
            .collect();

        let grammar_rule = GrammarRule::new(
            llm_response.title,
            llm_response.conspect,
            part_of_speech,
            examples,
            tests,
        );

        self.rule_repository.save(user_login, &grammar_rule).await?;

        info!(
            "Successfully created grammar rule: {}",
            grammar_rule.title()
        );
        Ok(grammar_rule)
    }

    #[instrument(skip(self, rule_description))]
    pub async fn create_from_description(
        &self,
        user_login: &str,
        rule_description: &str,
    ) -> Result<GrammarRule> {
        info!("Creating grammar rule from description");

        let llm_response = self
            .generate_grammar_rule_from_description(rule_description)
            .await?;

        let part_of_speech = llm_response.part_of_speech;

        let examples: Vec<RuleExample> = llm_response
            .examples
            .into_iter()
            .map(|ex| {
                RuleExample::new(ex.title, ex.content, ex.description, ex.content_translation)
            })
            .collect();

        let tests: Vec<RuleTest> = llm_response
            .tests
            .into_iter()
            .map(|test| RuleTest::new(test.rus_description, test.question_content, test.answer))
            .collect();

        let grammar_rule = GrammarRule::new(
            llm_response.title,
            llm_response.conspect,
            part_of_speech,
            examples,
            tests,
        );

        self.rule_repository.save(user_login, &grammar_rule).await?;

        info!(
            "Successfully created grammar rule: {}",
            grammar_rule.title()
        );
        Ok(grammar_rule)
    }

    #[instrument(skip(self))]
    pub async fn check_test_answer(
        &self,
        user_login: &str,
        rule_id: &str,
        test_id: &str,
        answer: &str,
    ) -> Result<bool> {
        info!(
            "Checking test answer for rule: {}, test: {}",
            rule_id, test_id
        );

        let rule = self.rule_repository.load(user_login, rule_id).await?;
        Ok(rule.check_test(test_id, answer))
    }

    #[instrument(skip(self))]
    pub async fn release_rule(&self, user_login: &str, rule_id: &str) -> Result<()> {
        info!("Releasing rule: {}", rule_id);

        let mut rule = self.rule_repository.load(user_login, rule_id).await?;
        rule.release();
        self.rule_repository.save(user_login, &rule).await?;

        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn remove_rule(&self, user_login: &str, rule_id: &str) -> Result<()> {
        info!("Removing rule: {}", rule_id);

        self.rule_repository.remove(user_login, rule_id).await?;

        Ok(())
    }

    #[instrument(skip(self))]
    async fn extract_grammar_rule_from_text(
        &self,
        japanese_text: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Extracting grammar rule from Japanese text");

        let prompt = format!(
            r#"Ты эксперт по японскому языку. Проанализируй следующий японский текст и определи основное грамматическое правило, которое используется. Создай подробное объяснение грамматического правила. Используй слова ТОЛЬКО уровня N5.

ВАЖНЫЕ ПРАВИЛА:
1. Определи основной грамматический паттерн/правило в тексте
2. Предоставь четкое название для правила
3. Дай подробный конспект на русском языке в формате Markdown, который ДОЛЖЕН включать:
   - Четкое определение грамматического правила
   - Пошаговое объяснение того, как работает правило и его структура
   - Конкретные паттерны образования с конкретными примерами
   - Когда и как использовать это грамматическое правило
   - Общие контексты использования и ситуации
   - Любые исключения или особые случаи
   - Сравнение с похожими грамматическими паттернами, если это уместно
   - Требуемые формы склонения/спряжения с похожими грамматическими паттернами, если это уместно
   - Используй заголовки (##, ###), списки, выделение текста (**жирный**, *курсив*, `тег`) и другие элементы Markdown для структурирования
4. Определи правильную часть речи из: Meishi, Daimeishi, Doushi, Keiyoushi, Keiyoudoushi, Fukushi, Rentaishi, Setsuzokushi, Joshi, Jodoushi, Kandoushi
5. Создай 4 примера с японским содержанием, русским переводом и объяснениями
6. Создай 5 простых тестовых вопросов, которые КОНКРЕТНО тестируют определенное грамматическое правило. Каждый тест ДОЛЖЕН фокусироваться на основном грамматическом паттерне и должен быть одного из этих типов:
   - Заполни пропуск: предоставь предложение с одним пропущенным словом/частицей, которое тестирует грамматическое правило (ответ 1-2 слова)
   - Множественный выбор: предоставь варианты в вопросе типа "Выбери: A) は B) が C) を", где выбор тестирует грамматическое правило
   - Завершить окончание: предоставь начало предложения, попроси завершить конкретной грамматической формой, которая изучается
   - Ответ одним словом: попроси конкретное слово/форму на японском, которое демонстрирует грамматическое правило (максимум 1-2 слова)
   - Каждый тестовый вопрос ДОЛЖЕН напрямую тестировать понимание основного грамматического правила, а не словарный запас или несвязанную грамматику
   - НИКАКИХ полных переводов предложений или сочинений

КРИТИЧНО: Все тестовые вопросы должны тестировать ТОЛЬКО конкретное грамматическое правило, определенное в заголовке. НЕ создавай тесты о:
- Общих знаниях словарного запаса
- Несвязанных грамматических паттернах
- Понимании прочитанного
- Культурных знаниях

Каждый тест должен требовать от студента демонстрации понимания конкретного изучаемого грамматического правила.

ПРИМЕРЫ ХОРОШИХ ТЕСТОВ:
- Для частицы は: "私___学生です。Выбери: A) は B) が C) を" (тестирует は как маркер темы)
- Для прошедшего времени: "昨日映画を見___。Завершить формой прошедшего времени" (тестирует образование прошедшего времени)
- Для спряжения прилагательных: "この本は___です。Заполни пропуск словом 'интересный' в вежливой форме" (тестирует использование прилагательных)

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{"title": "rule_title", "conspect": "detailed_conspect_in_russian_md", "part_of_speech": "part_of_speech_enum", "examples": [{{"title": "example_title", "content": "japanese_example", "description": "explanation_in_russian", "content_translation": "russian_translation"}}], "tests": [{{"rus_description": "test_description_in_russian", "question_content": "japanese_question", "answer": "correct_answer"}}]}}

Текст для анализа:
{}"#,
            japanese_text
        );

        let response: GrammarRuleResponse =
            self.llm_service.send_reasoning_request(&prompt).await?;
        info!("Successfully extracted grammar rule: {}", response.title);

        Ok(response)
    }

    #[instrument(skip(self))]
    async fn generate_grammar_rule_from_description(
        &self,
        rule_description: &str,
    ) -> Result<GrammarRuleResponse> {
        info!("Generating grammar rule from description");

        let prompt = format!(
            r#"Ты эксперт по японскому языку. На основе следующего описания создай подробное объяснение японского грамматического правила. Используй слова ТОЛЬКО уровня N5.

ВАЖНЫЕ ПРАВИЛА:
1. Создай четкое название для правила на основе описания
2. Предоставь подробный конспект на русском языке в формате Markdown, который ДОЛЖЕН включать:
   - Четкое определение грамматического правила
   - Пошаговое объяснение того, как работает правило и его структура
   - Конкретные паттерны образования с конкретными примерами
   - Когда и как использовать это грамматическое правило
   - Общие контексты использования и ситуации
   - Любые исключения или особые случаи
   - Сравнение с похожими грамматическими паттернами, если это уместно
   - Требуемые формы склонения/спряжения с похожими грамматическими паттернами, если это уместно
   - Используй заголовки (##, ###), списки, выделение текста (**жирный**, *курсив*) и другие элементы Markdown для структурирования
3. Определи правильную часть речи из: Meishi, Daimeishi, Doushi, Keiyoushi, Keiyoudoushi, Fukushi, Rentaishi, Setsuzokushi, Joshi, Jodoushi, Kandoushi
4. Создай 4 примера с японским содержанием, русским переводом и объяснениями
5. Создай 5 простых тестовых вопросов, которые КОНКРЕТНО тестируют грамматическое правило из описания. Каждый тест ДОЛЖЕН фокусироваться на основном грамматическом паттерне и должен быть одного из этих типов:
   - Заполни пропуск: предоставь предложение с одним пропущенным словом/частицей, которое тестирует грамматическое правило (ответ 1-2 слова)
   - Множественный выбор: предоставь варианты в вопросе типа "Выбери: A) は B) が C) を", где выбор тестирует грамматическое правило
   - Завершить окончание: предоставь начало предложения, попроси завершить конкретной грамматической формой, которая изучается
   - Ответ одним словом: попроси конкретное слово/форму на японском, которое демонстрирует грамматическое правило (максимум 1-2 слова)
   - Каждый тестовый вопрос ДОЛЖЕН напрямую тестировать понимание основного грамматического правила, а не словарный запас или несвязанную грамматику
   - НИКАКИХ полных переводов предложений или сочинений
6. Убедись, что весь контент точен и образователен

КРИТИЧНО: Все тестовые вопросы должны тестировать ТОЛЬКО конкретное грамматическое правило из описания. НЕ создавай тесты о:
- Общих знаниях словарного запаса
- Несвязанных грамматических паттернах
- Понимании прочитанного
- Культурных знаниях

Каждый тест должен требовать от студента демонстрации понимания конкретного изучаемого грамматического правила.

ПРИМЕРЫ ХОРОШИХ ТЕСТОВ:
- Для частицы は: "私___学生です。Выбери: A) は B) が C) を" (тестирует は как маркер темы)
- Для прошедшего времени: "昨日映画を見___。Завершить формой прошедшего времени" (тестирует образование прошедшего времени)
- Для спряжения прилагательных: "この本は___です。Заполни пропуск словом 'интересный' в вежливой форме" (тестирует использование прилагательных)

Возвращай ТОЛЬКО валидный JSON в точно таком формате:
{{"title": "rule_title", "conspect": "detailed_conspect_in_russian_md", "part_of_speech": "part_of_speech_enum", "examples": [{{"title": "example_title", "content": "japanese_example", "description": "explanation_in_russian", "content_translation": "russian_translation"}}], "tests": [{{"rus_description": "test_description_in_russian", "question_content": "japanese_question", "answer": "correct_answer"}}]}}

Описание правила:
{}"#,
            rule_description
        );

        let response: GrammarRuleResponse =
            self.llm_service.send_reasoning_request(&prompt).await?;
        info!("Successfully generated grammar rule: {}", response.title);

        Ok(response)
    }
}
