use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::instrument;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    user::auth::{Claims, JwtConfig, auth_middleware},
    word::{domain::set::LearnSetState, set_repository::LearnSetRepository},
};

use super::{domain::JapanesePartOfSpeech, word_repository::WordRepository};

#[derive(Clone)]
struct QueryState {
    set_repository: Arc<LearnSetRepository>,
    word_repository: Arc<WordRepository>,
}

pub fn query_router(
    set_repository: LearnSetRepository,
    word_repository: WordRepository,
    jwt_config: JwtConfig,
) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(get_overview))
        .routes(routes!(list_unknown_words))
        .routes(routes!(list_sets))
        .routes(routes!(get_set))
        .routes(routes!(list_released_words))
        .routes(routes!(list_test_released_words))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(QueryState {
            set_repository: Arc::new(set_repository),
            word_repository: Arc::new(word_repository),
        })
}

#[derive(Serialize, ToSchema)]
struct WordResponse {
    id: String,
    word: String,
    reading: Option<String>,
    translation: String,
    part_of_speech: Option<JapanesePartOfSpeech>,
}

#[derive(Serialize, ToSchema)]
struct SetResponse {
    id: String,
    state: LearnSetState,
    words: Vec<WordResponse>,
    time_to_learn: Option<DateTime<Utc>>,
    need_to_learn: bool,
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

#[derive(Deserialize, Debug)]
struct ReleasedSetsQuery {
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
    match state.set_repository.load_set(&claims.sub, &set_id).await {
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
                        reading: Some(w.reading()),
                        translation: w.translation().to_string(),
                        part_of_speech: w.part_of_speech().cloned(),
                    })
                    .collect(),
                time_to_learn: card_set.time_to_learn(),
                need_to_learn: card_set.need_to_learn(),
            };
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/sets/unknown",
    responses(
        (status = 200, description = "List of unknown words retrieved successfully", body = Vec<WordResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims))]
async fn list_unknown_words(
    State(state): State<QueryState>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<WordResponse>>, (StatusCode, String)> {
    // Get all word IDs from word repository
    match state.word_repository.list_word_ids(&claims.sub).await {
        Ok(word_ids) => {
            let mut words = Vec::new();

            // Load each word
            for word_id in word_ids {
                match state.word_repository.load_word(&claims.sub, &word_id).await {
                    Ok(word) => {
                        words.push(WordResponse {
                            id: word.id().to_string(),
                            word: word.word().to_string(),
                            reading: Some(word.reading()),
                            translation: word.translation().to_string(),
                            part_of_speech: word.part_of_speech().cloned(),
                        });
                    }
                    Err(_) => continue, // Skip words that couldn't be loaded
                }
            }

            Ok(axum::Json(words))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

#[utoipa::path(
    get,
    path = "/sets",
    responses(
        (status = 200, description = "List of all sets retrieved successfully", body = Vec<SetResponse>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims))]
async fn list_sets(
    State(state): State<QueryState>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<SetResponse>>, (StatusCode, String)> {
    // Get all set IDs from repository
    match state.set_repository.list_ids(&claims.sub).await {
        Ok(set_ids) => {
            let mut sets = Vec::new();

            // Load each set
            for set_id in set_ids {
                match state.set_repository.load_set(&claims.sub, &set_id).await {
                    Ok(set) => {
                        sets.push(SetResponse {
                            id: set.id().to_string(),
                            state: set.state().clone(),
                            words: set
                                .words()
                                .iter()
                                .map(|w| WordResponse {
                                    id: w.id().to_string(),
                                    word: w.word().to_string(),
                                    reading: Some(w.reading()),
                                    translation: w.translation().to_string(),
                                    part_of_speech: w.part_of_speech().cloned(),
                                })
                                .collect(),
                            time_to_learn: set.time_to_learn(),
                            need_to_learn: set.need_to_learn(),
                        });
                    }
                    Err(_) => continue, // Skip sets that couldn't be loaded
                }
            }

            Ok(axum::Json(sets))
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

    match state.word_repository.list_word_ids(&claims.sub).await {
        Ok(word_ids) => {
            let mut words = Vec::new();

            // Load each word and filter by search
            for word_id in word_ids {
                if let Ok(word) = state.word_repository.load_word(&claims.sub, &word_id).await {
                    let matches_search = if let Some(search) = &search {
                        word.word().to_lowercase().contains(search)
                            || word.translation().to_lowercase().contains(search)
                    } else {
                        true
                    };

                    if matches_search {
                        words.push(WordResponse {
                            id: word.id().to_string(),
                            word: word.word().to_string(),
                            reading: Some(word.reading()),
                            translation: word.translation().to_string(),
                            part_of_speech: word.part_of_speech().cloned(),
                        });
                    }
                }
            }

            Ok(axum::Json(words))
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
    match state.set_repository.list_ids(&claims.sub).await {
        Ok(set_ids) => {
            for set_id in set_ids {
                if let Ok(card_set) = state.set_repository.load_set(&claims.sub, &set_id).await {
                    let preview = match card_set.state() {
                        LearnSetState::Tobe => &mut overview.tobe,
                        _ => &mut overview.current,
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
                                    reading: Some(w.reading()),
                                    translation: w.translation().to_string(),
                                    part_of_speech: w.part_of_speech().cloned(),
                                }),
                        );
                    }
                }
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }

    match state.word_repository.list_word_ids(&claims.sub).await {
        Ok(word_ids) => {
            overview.finished.total_words = word_ids.len();

            let mut finished_words = Vec::new();
            for word_id in word_ids.iter().take(3) {
                if let Ok(word) = state.word_repository.load_word(&claims.sub, word_id).await {
                    finished_words.push(WordResponse {
                        id: word.id().to_string(),
                        word: word.word().to_string(),
                        reading: Some(word.reading()),
                        translation: word.translation().to_string(),
                        part_of_speech: word.part_of_speech().cloned(),
                    });
                }
            }
            overview.finished.preview_words = finished_words;
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }

    Ok(Json(overview))
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
    match state.word_repository.list_word_ids(&claims.sub).await {
        Ok(word_ids) => {
            let mut words = Vec::new();

            // Load each word
            for word_id in word_ids {
                if let Ok(word) = state.word_repository.load_word(&claims.sub, &word_id).await {
                    words.push(word);
                }
            }

            // Sort by release timestamp if available
            words.sort_by(|a, b| {
                match (a.release_timestamp(), b.release_timestamp()) {
                    (Some(a_time), Some(b_time)) => b_time.cmp(&a_time), // newest first
                    (Some(_), None) => std::cmp::Ordering::Less,
                    (None, Some(_)) => std::cmp::Ordering::Greater,
                    (None, None) => std::cmp::Ordering::Equal,
                }
            });

            let result = words
                .iter()
                .map(|w| WordResponse {
                    id: w.id().to_string(),
                    word: w.word().to_string(),
                    reading: Some(w.reading()),
                    translation: w.translation().to_string(),
                    part_of_speech: w.part_of_speech().cloned(),
                })
                .collect();

            Ok(axum::Json(result))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}
