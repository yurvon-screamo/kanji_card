use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::instrument;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    domain::{rule::JapanesePartOfSpeech, word::SetState},
    environment::auth::{Claims, JwtConfig, auth_middleware},
    rule_repository::RuleRepository,
    word_release_repository::WordReleaseRepository,
    word_repository::WordRepository,
};

#[derive(Clone)]
struct QueryState {
    repository: Arc<WordRepository>,
    release_repository: Arc<WordReleaseRepository>,
    rule_repository: Arc<RuleRepository>,
}

pub fn query_router(
    set_repository: WordRepository,
    release_repository: WordReleaseRepository,
    rule_repository: RuleRepository,
    jwt_config: JwtConfig,
) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(get_set))
        .routes(routes!(list_tobe_sets))
        .routes(routes!(list_current_sets))
        .routes(routes!(list_released_words))
        .routes(routes!(list_test_released_words))
        .routes(routes!(list_released_stories))
        .routes(routes!(get_overview))
        .routes(routes!(list_rules))
        .routes(routes!(get_rule))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(QueryState {
            repository: Arc::new(set_repository),
            release_repository: Arc::new(release_repository),
            rule_repository: Arc::new(rule_repository),
        })
}

#[derive(Serialize, ToSchema)]
struct SetResponse {
    id: String,
    state: SetState,
    words: Vec<WordResponse>,
    story: Option<StoryResponse>,
}

#[derive(Serialize, ToSchema)]
struct StoryResponse {
    id: String,
    story: Vec<String>,
    story_translate: Vec<String>,
    story_reading: Vec<String>,
}

#[derive(Serialize, ToSchema)]
struct WordResponse {
    id: String,
    word: String,
    reading: Option<String>,
    translation: String,
}

#[derive(Serialize, ToSchema)]
struct WordOverview {
    tobe: SetPreview,
    current: SetPreview,
    finished: SetPreview,
}

#[derive(Serialize, ToSchema)]
struct SetPreview {
    total_words: usize,
    preview_words: Vec<WordResponse>,
}

#[derive(Serialize, ToSchema)]
struct RuleResponse {
    id: String,
    title: String,
    description: String,
    is_released: bool,
    release_time: Option<String>,
    part_of_speech: JapanesePartOfSpeech,
}

#[derive(Serialize, ToSchema)]
struct RuleDetailResponse {
    id: String,
    title: String,
    description: String,
    examples: Vec<RuleExampleResponse>,
    tests: Vec<RuleTestResponse>,
    is_released: bool,
    release_time: Option<String>,
    part_of_speech: JapanesePartOfSpeech,
}

#[derive(Serialize, ToSchema)]
struct RuleExampleResponse {
    title: String,
    content: String,
    description: String,
    content_translation: String,
}

#[derive(Serialize, ToSchema)]
struct RuleTestResponse {
    id: String,
    description: String,
    question: String,
    answer: String,
}

#[derive(Deserialize, Debug)]
struct ReleasedSetsQuery {
    search: Option<String>,
}

#[derive(Deserialize, Debug)]
struct RulesQuery {
    search: Option<String>,
}

#[utoipa::path(
    get,
    path = "/sets/{id}",
    params(
        ("id" = String, Path, description = "Set ID")
    ),
    responses(
        (status = 200, description = "Set retrieved successfully", body = SetResponse),
        (status = 404, description = "Set not found"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(set_id = %set_id))]
async fn get_set(
    State(state): State<QueryState>,
    Path(set_id): Path<String>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<SetResponse>, (StatusCode, String)> {
    match state.repository.load(&claims.sub, &set_id).await {
        Ok(card_set) => {
            let response = SetResponse {
                id: card_set.id().to_string(),
                state: card_set.state().clone(),
                words: card_set
                    .words()
                    .iter()
                    .map(|w| WordResponse {
                        id: w.id().to_string(),
                        word: w.word().to_string(),
                        reading: w.reading().map(|r| r.to_string()),
                        translation: w.translation().to_string(),
                    })
                    .collect(),
                story: card_set.story().map(|s| StoryResponse {
                    id: s.id().to_string(),
                    story: s.story().to_vec(),
                    story_translate: s.story_translate().to_vec(),
                    story_reading: s.story_reading().to_vec(),
                }),
            };
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/sets/tobe",
    responses(
        (status = 200, description = "List of tobe sets retrieved successfully", body = Vec<SetResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims))]
async fn list_tobe_sets(
    State(state): State<QueryState>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<SetResponse>>, (StatusCode, String)> {
    match state.repository.list_all(&claims.sub).await {
        Ok(sets) => {
            let response = sets
                .into_iter()
                .filter(|set| set.state() == &SetState::Tobe)
                .map(|set| SetResponse {
                    id: set.id().to_string(),
                    state: set.state().clone(),
                    words: set
                        .words()
                        .iter()
                        .map(|w| WordResponse {
                            id: w.id().to_string(),
                            word: w.word().to_string(),
                            reading: w.reading().map(|r| r.to_string()),
                            translation: w.translation().to_string(),
                        })
                        .collect(),
                    story: set.story().map(|s| StoryResponse {
                        id: s.id().to_string(),
                        story: s.story().to_vec(),
                        story_translate: s.story_translate().to_vec(),
                        story_reading: s.story_reading().to_vec(),
                    }),
                })
                .collect();
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/sets/current",
    responses(
        (status = 200, description = "List of current sets retrieved successfully", body = Vec<SetResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims))]
async fn list_current_sets(
    State(state): State<QueryState>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<SetResponse>>, (StatusCode, String)> {
    match state.repository.list_all(&claims.sub).await {
        Ok(sets) => {
            let response = sets
                .into_iter()
                .filter(|set| set.state() == &SetState::Current)
                .map(|set| SetResponse {
                    id: set.id().to_string(),
                    state: set.state().clone(),
                    words: set
                        .words()
                        .iter()
                        .map(|w| WordResponse {
                            id: w.id().to_string(),
                            word: w.word().to_string(),
                            reading: w.reading().map(|r| r.to_string()),
                            translation: w.translation().to_string(),
                        })
                        .collect(),
                    story: set.story().map(|s| StoryResponse {
                        id: s.id().to_string(),
                        story: s.story().to_vec(),
                        story_translate: s.story_translate().to_vec(),
                        story_reading: s.story_reading().to_vec(),
                    }),
                })
                .collect();
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/sets/released",
    params(
        ("search" = Option<String>, Query, description = "Search term for cards (case-insensitive)")
    ),
    responses(
        (status = 200, description = "List of released cards retrieved successfully", body = Vec<WordResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(search = ?params.search))]
async fn list_released_words(
    State(state): State<QueryState>,
    Query(params): Query<ReleasedSetsQuery>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<WordResponse>>, (StatusCode, String)> {
    let search = params.search.map(|x| x.to_lowercase());

    match state.release_repository.list_all_words(&claims.sub).await {
        Ok(cards) => {
            let response = cards
                .iter()
                .filter(|w| {
                    if let Some(search) = &search {
                        w.word().to_lowercase().contains(search)
                            || w.translation().to_lowercase().contains(search)
                            || w.reading()
                                .map(|r| r.to_lowercase().contains(search))
                                .unwrap_or(false)
                    } else {
                        true
                    }
                })
                .map(|w| WordResponse {
                    id: w.id().to_string(),
                    word: w.word().to_string(),
                    reading: w.reading().map(|r| r.to_string()),
                    translation: w.translation().to_string(),
                })
                .collect();
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/stories/released",
    params(
        ("search" = Option<String>, Query, description = "Search term for stories (case-insensitive)")
    ),
    responses(
        (status = 200, description = "List of released stories retrieved successfully", body = Vec<StoryResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(search = ?params.search))]
async fn list_released_stories(
    State(state): State<QueryState>,
    Query(params): Query<ReleasedSetsQuery>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<StoryResponse>>, (StatusCode, String)> {
    let search = params.search.map(|x| x.to_lowercase());

    match state.release_repository.list_all_stories(&claims.sub).await {
        Ok(stories) => {
            let response = stories
                .iter()
                .filter(|s| {
                    if let Some(search) = &search {
                        s.story()
                            .iter()
                            .any(|line| line.to_lowercase().contains(search))
                            || s.story_translate()
                                .iter()
                                .any(|line| line.to_lowercase().contains(search))
                    } else {
                        true
                    }
                })
                .map(|s| StoryResponse {
                    id: s.id().to_string(),
                    story: s.story().to_vec(),
                    story_translate: s.story_translate().to_vec(),
                    story_reading: s.story_reading().to_vec(),
                })
                .collect();
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/overview",
    responses(
        (status = 200, description = "Sets overview retrieved successfully", body = WordOverview),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims))]
async fn get_overview(
    State(state): State<QueryState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<WordOverview>, (StatusCode, String)> {
    let mut overview = WordOverview {
        tobe: SetPreview {
            total_words: 0,
            preview_words: Vec::new(),
        },
        current: SetPreview {
            total_words: 0,
            preview_words: Vec::new(),
        },
        finished: SetPreview {
            total_words: 0,
            preview_words: Vec::new(),
        },
    };

    // Handle current and tobe sets
    match state.repository.list_all(&claims.sub).await {
        Ok(all_sets) => {
            for card_set in all_sets {
                let preview = match card_set.state() {
                    SetState::Tobe => &mut overview.tobe,
                    SetState::Current => &mut overview.current,
                };

                preview.total_words += card_set.words().len();

                if preview.preview_words.len() < 3 {
                    preview.preview_words.extend(
                        card_set
                            .words()
                            .iter()
                            .take(3 - preview.preview_words.len())
                            .map(|w| WordResponse {
                                id: w.id().to_string(),
                                word: w.word().to_string(),
                                reading: w.reading().map(|r| r.to_string()),
                                translation: w.translation().to_string(),
                            }),
                    );
                }
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }

    match state.release_repository.list_all_words(&claims.sub).await {
        Ok(finished_cards) => {
            overview.finished.total_words = finished_cards.len();

            if overview.finished.preview_words.len() < 3 {
                overview.finished.preview_words.extend(
                    finished_cards
                        .iter()
                        .take(3 - overview.finished.preview_words.len())
                        .map(|w| WordResponse {
                            id: w.id().to_string(),
                            word: w.word().to_string(),
                            reading: w.reading().map(|r| r.to_string()),
                            translation: w.translation().to_string(),
                        }),
                );
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }

    Ok(Json(overview))
}

#[utoipa::path(
    get,
    path = "/rules",
    params(
        ("search" = Option<String>, Query, description = "Search term for rules (case-insensitive)")
    ),
    responses(
        (status = 200, description = "List of rules retrieved successfully", body = Vec<RuleResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(search = ?params.search))]
async fn list_rules(
    State(state): State<QueryState>,
    Query(params): Query<RulesQuery>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<RuleResponse>>, (StatusCode, String)> {
    let search = params.search.map(|x| x.to_lowercase());

    match state.rule_repository.list_all(&claims.sub).await {
        Ok(rules) => {
            let response = rules
                .iter()
                .filter(|r| {
                    if let Some(search) = &search {
                        r.title().to_lowercase().contains(search)
                            || r.description().to_lowercase().contains(search)
                    } else {
                        true
                    }
                })
                .map(|r| RuleResponse {
                    id: r.id().to_string(),
                    title: r.title().to_string(),
                    description: r.description().to_string(),
                    is_released: r.is_released(),
                    release_time: r.release_timestamp().map(|t| t.to_string()),
                    part_of_speech: r.part_of_speech().clone(),
                })
                .collect();
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/rules/{id}",
    params(
        ("id" = String, Path, description = "Rule ID")
    ),
    responses(
        (status = 200, description = "Rule retrieved successfully", body = RuleDetailResponse),
        (status = 404, description = "Rule not found"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(rule_id = %rule_id))]
async fn get_rule(
    State(state): State<QueryState>,
    Path(rule_id): Path<String>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<RuleDetailResponse>, (StatusCode, String)> {
    match state.rule_repository.load(&claims.sub, &rule_id).await {
        Ok(rule) => {
            let response = RuleDetailResponse {
                id: rule.id().to_string(),
                title: rule.title().to_string(),
                description: rule.description().to_string(),
                examples: rule
                    .examples()
                    .iter()
                    .map(|e| RuleExampleResponse {
                        title: e.title().to_string(),
                        content: e.content().to_string(),
                        description: e.description().to_string(),
                        content_translation: e.content_translation().to_string(),
                    })
                    .collect(),
                tests: rule
                    .tests()
                    .iter()
                    .map(|t| RuleTestResponse {
                        id: t.test_id().to_string(),
                        description: t.rus_description().to_string(),
                        question: t.question_content().to_string(),
                        answer: t.answer().to_string(),
                    })
                    .collect(),
                is_released: rule.is_released(),
                release_time: rule.release_timestamp().map(|t| t.to_string()),
                part_of_speech: rule.part_of_speech().clone(),
            };
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/sets/test-released",
    responses(
        (status = 200, description = "List of test released cards retrieved successfully in alternating order by release date", body = Vec<WordResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims))]
async fn list_test_released_words(
    State(state): State<QueryState>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<WordResponse>>, (StatusCode, String)> {
    match state.release_repository.list_all_words(&claims.sub).await {
        Ok(mut cards) => {
            cards.sort_by(|a, b| {
                match (a.release_timestamp(), b.release_timestamp()) {
                    (Some(a_time), Some(b_time)) => b_time.cmp(&a_time), // newest first
                    (Some(_), None) => std::cmp::Ordering::Less,
                    (None, Some(_)) => std::cmp::Ordering::Greater,
                    (None, None) => std::cmp::Ordering::Equal,
                }
            });

            let result = cards
                .iter()
                .map(|x| WordResponse {
                    id: x.id().to_string(),
                    word: x.word().to_string(),
                    reading: x.reading().map(|r| r.to_string()),
                    translation: x.translation().to_string(),
                })
                .collect();

            Ok(axum::Json(result))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}
