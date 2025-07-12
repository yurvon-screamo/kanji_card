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
    environment::auth::{Claims, JwtConfig, auth_middleware},
    word::{
        domain::set::LearnSetState, set_repository::LearnSetRepository,
        word_release_repository::WordReleaseRepository,
    },
};

#[derive(Clone)]
struct QueryState {
    repository: Arc<LearnSetRepository>,
    release_repository: Arc<WordReleaseRepository>,
}

pub fn query_router(
    set_repository: LearnSetRepository,
    release_repository: WordReleaseRepository,
    jwt_config: JwtConfig,
) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(get_set))
        .routes(routes!(list_tobe_sets))
        .routes(routes!(list_current_sets))
        .routes(routes!(list_released_words))
        .routes(routes!(list_test_released_words))
        .routes(routes!(get_overview))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(QueryState {
            repository: Arc::new(set_repository),
            release_repository: Arc::new(release_repository),
        })
}

#[derive(Serialize, ToSchema)]
struct WordResponse {
    id: String,
    word: String,
    reading: Option<String>,
    translation: String,
}

#[derive(Serialize, ToSchema)]
struct CurrentSets {
    word_count_to_learn: usize,
    need_to_learn: Vec<SetResponse>,

    word_count_to_feature: usize,
    to_feature: Vec<SetResponse>,
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
                        reading: Some(w.reading()),
                        translation: w.translation().to_string(),
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
                .filter(|set| set.state() == &LearnSetState::Tobe)
                .map(|set| SetResponse {
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
                        })
                        .collect(),
                    time_to_learn: set.time_to_learn(),
                    need_to_learn: set.need_to_learn(),
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
        (status = 200, description = "Current sets retrieved successfully", body = CurrentSets),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims))]
async fn list_current_sets(
    State(state): State<QueryState>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<CurrentSets>, (StatusCode, String)> {
    match state.repository.list_all(&claims.sub).await {
        Ok(sets) => {
            let mut need_to_learn = Vec::new();
            let mut to_feature = Vec::new();
            let mut word_count_to_learn = 0;
            let mut word_count_to_feature = 0;

            for set in sets {
                if set.state() != &LearnSetState::Tobe {
                    let set_response = SetResponse {
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
                            })
                            .collect(),
                        time_to_learn: set.time_to_learn(),
                        need_to_learn: set.need_to_learn(),
                    };

                    if set.need_to_learn() {
                        word_count_to_learn += set.words().len();
                        need_to_learn.push(set_response);
                    } else {
                        word_count_to_feature += set.words().len();
                        to_feature.push(set_response);
                    }
                }
            }

            Ok(axum::Json(CurrentSets {
                word_count_to_learn,
                need_to_learn,
                word_count_to_feature,
                to_feature,
            }))
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
                    } else {
                        true
                    }
                })
                .map(|w| WordResponse {
                    id: w.id().to_string(),
                    word: w.word().to_string(),
                    reading: Some(w.reading()),
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
                            reading: Some(w.reading()),
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
                .map(|w| WordResponse {
                    id: w.id().to_string(),
                    word: w.word().to_string(),
                    reading: Some(w.reading()),
                    translation: w.translation().to_string(),
                })
                .collect();

            Ok(axum::Json(result))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}
