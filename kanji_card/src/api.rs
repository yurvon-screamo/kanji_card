use axum::{
    Json,
    extract::{Extension, State},
    http::StatusCode,
    middleware,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, instrument};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    auth::{Claims, JwtConfig, auth_middleware},
    llm::ExtractedWord,
    set_service::SetService,
};

#[derive(Clone)]
struct ApiState {
    set_service: Arc<SetService>,
}

pub fn set_api_router(set_service: SetService, jwt_config: JwtConfig) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(extract_words_from_text))
        .routes(routes!(extract_words_from_image))
        .routes(routes!(save_words))
        .routes(routes!(mark_as_current))
        .routes(routes!(mark_as_finished))
        .routes(routes!(mark_as_tobe))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(ApiState {
            set_service: Arc::new(set_service),
        })
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
