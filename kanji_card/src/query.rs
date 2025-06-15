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
    auth::{Claims, JwtConfig, auth_middleware},
    domain::SetState,
    repository::CardSetRepository,
};

#[derive(Clone)]
struct QueryState {
    repository: Arc<CardSetRepository>,
}

pub fn query_router(repository: CardSetRepository, jwt_config: JwtConfig) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(get_set))
        .routes(routes!(list_sets))
        .routes(routes!(get_overview))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(QueryState {
            repository: Arc::new(repository),
        })
}

#[derive(Serialize, ToSchema)]
struct SetResponse {
    id: String,
    state: SetState,
    words: Vec<WordResponse>,
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
            };
            Ok(axum::Json(response))
        }
        Err(e) => Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

#[derive(Deserialize, Debug)]
struct ListSetsQuery {
    state: Option<SetState>,
}

#[utoipa::path(
    get,
    path = "/sets",
    params(
        ("state" = Option<SetState>, Query, description = "Filter by set state")
    ),
    responses(
        (status = 200, description = "List of set IDs retrieved successfully", body = Vec<String>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(state = ?params.state))]
async fn list_sets(
    State(state): State<QueryState>,
    Query(params): Query<ListSetsQuery>,
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<Vec<String>>, (StatusCode, String)> {
    let state_to_query = params.state.unwrap_or(SetState::Current);
    match state
        .repository
        .list_ids(&claims.sub, &state_to_query)
        .await
    {
        Ok(ids) => Ok(axum::Json(ids)),
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

    match state.repository.list_all(&claims.sub).await {
        Ok(all_sets) => {
            for card_set in all_sets {
                let preview = match card_set.state() {
                    SetState::Tobe => &mut overview.tobe,
                    SetState::Current => &mut overview.current,
                    SetState::Finished => &mut overview.finished,
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
            Ok(Json(overview))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}
