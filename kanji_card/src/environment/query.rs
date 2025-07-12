use axum::{
    Extension,
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
    environment::auth::{Claims, JwtConfig, auth_middleware},
    rule::rule::JapanesePartOfSpeech,
    rule_repository::RuleRepository,
};

#[derive(Clone)]
struct QueryState {
    rule_repository: Arc<RuleRepository>,
}

pub fn query_router(rule_repository: RuleRepository, jwt_config: JwtConfig) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(list_rules))
        .routes(routes!(get_rule))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(QueryState {
            rule_repository: Arc::new(rule_repository),
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
