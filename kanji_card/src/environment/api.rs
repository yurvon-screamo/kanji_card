use crate::{
    application::{rule_service::RuleService, set_service::SetService},
    domain::rule::JapanesePartOfSpeech,
    environment::auth,
    llm::ExtractedWord,
};
use auth::{Claims, JwtConfig, auth_middleware};
use axum::{
    Json,
    extract::{Extension, Path, State},
    http::StatusCode,
    middleware,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, instrument};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone)]
struct ApiState {
    set_service: Arc<SetService>,
    rule_service: Arc<RuleService>,
}

pub fn set_api_router(
    set_service: SetService,
    rule_service: RuleService,
    jwt_config: JwtConfig,
) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(extract_words_from_text))
        .routes(routes!(extract_words_from_image))
        .routes(routes!(save_words))
        .routes(routes!(mark_as_current))
        .routes(routes!(mark_as_finished))
        .routes(routes!(mark_as_tobe))
        .routes(routes!(create_rule_from_text))
        .routes(routes!(create_rule_from_description))
        .routes(routes!(check_test_answer))
        .routes(routes!(release_rule))
        .routes(routes!(remove_rule))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(ApiState {
            set_service: Arc::new(set_service),
            rule_service: Arc::new(rule_service),
        })
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct ReleaseRuleRequest {
    rule_id: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct ExtractWordsFromTextRequest {
    text: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct ExtractWordsFromImageRequest {
    image_data: Vec<u8>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct SaveWordsRequest {
    words: Vec<ExtractedWord>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct LoginRequest {
    login: String,
    password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct RegisterRequest {
    login: String,
    password: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct MarkAsTobeRequest {
    word_ids: Vec<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct CreateRuleFromTextRequest {
    text: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct CreateRuleFromDescriptionRequest {
    description: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct CheckTestAnswerRequest {
    rule_id: String,
    test_id: String,
    answer: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct CheckTestAnswerResponse {
    is_correct: bool,
}

#[utoipa::path(
    post,
    path = "/sets/words/extract/text",
    request_body = ExtractWordsFromTextRequest,
    responses(
        (status = 200, description = "Words extracted successfully", body = Vec<ExtractedWord>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, request))]
async fn extract_words_from_text(
    State(state): State<ApiState>,
    Json(request): Json<ExtractWordsFromTextRequest>,
) -> Result<axum::Json<Vec<ExtractedWord>>, (StatusCode, String)> {
    info!("Extracting words from text");
    match state
        .set_service
        .extract_words_from_text(request.text)
        .await
    {
        Ok(words) => {
            info!("Successfully extracted {} words", words.len());
            Ok(axum::Json(words))
        }
        Err(e) => {
            error!("Failed to extract words: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct CreateRuleResponse {
    id: String,
    title: String,
    description: String,
    part_of_speech: JapanesePartOfSpeech,
}

#[utoipa::path(
    post,
    path = "/rules/create/text",
    request_body = CreateRuleFromTextRequest,
    responses(
        (status = 200, description = "Grammar rule created successfully", body = CreateRuleResponse),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, request, claims))]
async fn create_rule_from_text(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateRuleFromTextRequest>,
) -> Result<axum::Json<CreateRuleResponse>, (StatusCode, String)> {
    info!("Creating grammar rule from text");
    match state
        .rule_service
        .create_from_text(&claims.sub, &request.text)
        .await
    {
        Ok(rule) => {
            info!("Successfully created grammar rule: {}", rule.title());
            let response = CreateRuleResponse {
                id: rule.id().to_string(),
                title: rule.title().to_string(),
                description: rule.description().to_string(),
                part_of_speech: rule.part_of_speech().clone(),
            };
            Ok(axum::Json(response))
        }
        Err(e) => {
            error!("Failed to create grammar rule from text: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    post,
    path = "/rules/create/description",
    request_body = CreateRuleFromDescriptionRequest,
    responses(
        (status = 200, description = "Grammar rule created successfully", body = CreateRuleResponse),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, request, claims))]
async fn create_rule_from_description(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CreateRuleFromDescriptionRequest>,
) -> Result<axum::Json<CreateRuleResponse>, (StatusCode, String)> {
    info!("Creating grammar rule from description");
    match state
        .rule_service
        .create_from_description(&claims.sub, &request.description)
        .await
    {
        Ok(rule) => {
            info!("Successfully created grammar rule: {}", rule.title());
            let response = CreateRuleResponse {
                id: rule.id().to_string(),
                title: rule.title().to_string(),
                description: rule.description().to_string(),
                part_of_speech: rule.part_of_speech().clone(),
            };
            Ok(axum::Json(response))
        }
        Err(e) => {
            error!("Failed to create grammar rule from description: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    post,
    path = "/rules/check-test",
    request_body = CheckTestAnswerRequest,
    responses(
        (status = 200, description = "Test answer checked successfully", body = CheckTestAnswerResponse),
        (status = 404, description = "Rule or test not found"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, request, claims))]
async fn check_test_answer(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<CheckTestAnswerRequest>,
) -> Result<axum::Json<CheckTestAnswerResponse>, (StatusCode, String)> {
    info!(
        "Checking test answer for rule: {}, test: {}",
        request.rule_id, request.test_id
    );
    match state
        .rule_service
        .check_test_answer(
            &claims.sub,
            &request.rule_id,
            &request.test_id,
            &request.answer,
        )
        .await
    {
        Ok(is_correct) => {
            info!("Test answer check result: {}", is_correct);
            let response = CheckTestAnswerResponse { is_correct };
            Ok(axum::Json(response))
        }
        Err(e) => {
            error!("Failed to check test answer: {}", e);
            if e.to_string().contains("Rule not found") {
                Err((StatusCode::NOT_FOUND, e.to_string()))
            } else {
                Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
            }
        }
    }
}

#[utoipa::path(
    post,
    path = "/rules/release",
    request_body = ReleaseRuleRequest,
    responses(
        (status = 200, description = "Rule released successfully"),
        (status = 404, description = "Rule not found"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, request, claims))]
async fn release_rule(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<ReleaseRuleRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!("Releasing rule: {}", request.rule_id);
    match state
        .rule_service
        .release_rule(&claims.sub, &request.rule_id)
        .await
    {
        Ok(_) => {
            info!("Successfully released rule: {}", request.rule_id);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!("Failed to release rule: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    delete,
    path = "/rules/{id}",
    params(
        ("id" = String, Path, description = "Rule ID")
    ),
    responses(
        (status = 200, description = "Rule removed successfully"),
        (status = 404, description = "Rule not found"),
        (status = 500, description = "Internal server error")
    )
)]
async fn remove_rule(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!("Removing rule: {}", id);
    match state.rule_service.remove_rule(&claims.sub, &id).await {
        Ok(_) => {
            info!("Successfully removed rule: {}", id);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!("Failed to remove rule: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    post,
    path = "/sets/words/extract/image",
    request_body = ExtractWordsFromImageRequest,
    responses(
        (status = 200, description = "Words extracted successfully", body = Vec<ExtractedWord>),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, request))]
async fn extract_words_from_image(
    State(state): State<ApiState>,
    Json(request): Json<ExtractWordsFromImageRequest>,
) -> Result<axum::Json<Vec<ExtractedWord>>, (StatusCode, String)> {
    info!("Extracting words from image");
    match state
        .set_service
        .extract_words_from_image(request.image_data)
        .await
    {
        Ok(words) => {
            info!("Successfully extracted {} words from image", words.len());
            Ok(axum::Json(words))
        }
        Err(e) => {
            error!("Failed to extract words from image: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    post,
    path = "/sets/words/save",
    request_body = SaveWordsRequest,
    responses(
        (status = 200, description = "Words saved successfully"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims, request))]
async fn save_words(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<SaveWordsRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!(
        "Saving {} words for user {}",
        request.words.len(),
        claims.sub
    );
    match state
        .set_service
        .save_words(&claims.sub, request.words, false)
        .await
    {
        Ok(_) => {
            info!("Successfully saved words for user {}", claims.sub);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!("Failed to save words for user {}: {}", claims.sub, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    put,
    path = "/sets/{id}/current",
    params(
        ("id" = String, Path, description = "Set ID")
    ),
    responses(
        (status = 200, description = "Set marked as current successfully"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(set_id = %set_id))]
async fn mark_as_current(
    State(state): State<ApiState>,
    axum::extract::Path(set_id): axum::extract::Path<String>,
    Extension(claims): Extension<Claims>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!("Marking set {} as current for user {}", set_id, claims.sub);
    match state
        .set_service
        .mark_as_current(&claims.sub, &set_id)
        .await
    {
        Ok(_) => {
            info!("Successfully marked set {} as current", set_id);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!("Failed to mark set {} as current: {}", set_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    put,
    path = "/sets/{id}/finished",
    params(
        ("id" = String, Path, description = "Set ID")
    ),
    responses(
        (status = 200, description = "Set marked as finished successfully"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(set_id = %set_id))]
async fn mark_as_finished(
    State(state): State<ApiState>,
    axum::extract::Path(set_id): axum::extract::Path<String>,
    Extension(claims): Extension<Claims>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!("Marking set {} as finished for user {}", set_id, claims.sub);
    match state.set_service.release_set(&claims.sub, &set_id).await {
        Ok(_) => {
            info!("Successfully marked set {} as finished", set_id);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!("Failed to mark set {} as finished: {}", set_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    put,
    path = "/sets/tobe",
    request_body = MarkAsTobeRequest,
    responses(
        (status = 200, description = "Words marked as tobe successfully"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims, request))]
async fn mark_as_tobe(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<MarkAsTobeRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!(
        "Marking {} words as tobe for user {}",
        request.word_ids.len(),
        claims.sub
    );
    match state
        .set_service
        .mark_as_tobe(&claims.sub, request.word_ids)
        .await
    {
        Ok(_) => {
            info!("Successfully marked words as tobe for user {}", claims.sub);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!(
                "Failed to mark words as tobe for user {}: {}",
                claims.sub, e
            );
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}
