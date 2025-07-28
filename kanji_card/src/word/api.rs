use crate::{llm::ExtractedWord, user::auth, word::set_service::SetService};
use auth::{Claims, JwtConfig, auth_middleware};
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

use super::{word_creator::WordCreator, word_release_manager::WordReleaseManager};

#[derive(Clone)]
struct ApiState {
    word_creator: Arc<WordCreator>,
    set_service: Arc<SetService>,
    word_release_manager: Arc<WordReleaseManager>,
}

pub fn set_api_router(
    word_creator: WordCreator,
    set_service: SetService,
    word_release_manager: WordReleaseManager,

    jwt_config: JwtConfig,
) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(extract_words_from_text))
        .routes(routes!(extract_words_from_image))
        .routes(routes!(save_words))
        .routes(routes!(next_iter))
        .routes(routes!(build_new_set))
        .routes(routes!(mark_word_as_unknown))
        .layer(middleware::from_fn_with_state(
            jwt_config.clone(),
            auth_middleware,
        ))
        .with_state(ApiState {
            word_creator: Arc::new(word_creator),
            set_service: Arc::new(set_service),
            word_release_manager: Arc::new(word_release_manager),
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

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct MarkAsTobeRequest {
    set_size: usize,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
struct MarkAsUnknownRequest {
    word_id: String,
}

#[utoipa::path(
    post,
    path = "/extract/text",
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
        .word_creator
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
    path = "/extract/image",
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
        .word_creator
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
    path = "/save_word",
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
        .word_creator
        .save_extracted_words(&claims.sub, request.words)
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
    path = "/next_iter/{set_id}",
    params(
        ("set_id" = String, Path, description = "Set ID")
    ),
    responses(
        (status = 200, description = "Set to next learn stage successfully"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims), fields(set_id = %set_id))]
async fn next_iter(
    State(state): State<ApiState>,
    axum::extract::Path(set_id): axum::extract::Path<String>,
    Extension(claims): Extension<Claims>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!("Moved set {} to next stage for user {}", set_id, claims.sub);
    match state.set_service.to_next_iter(&claims.sub, &set_id).await {
        Ok(_) => {
            info!("Successfully moved set {} to next stage", set_id);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!("Failed to move set {} to next stage: {}", set_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

#[utoipa::path(
    post,
    path = "/build_set",
    request_body = MarkAsTobeRequest,
    responses(
        (status = 200, description = "Words marked as tobe successfully"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims, request))]
async fn build_new_set(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<MarkAsTobeRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!(
        "Marking {} words as tobe for user {}",
        request.set_size, claims.sub
    );

    match state
        .set_service
        .build_new_set(&claims.sub, request.set_size)
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

#[utoipa::path(
    put,
    path = "/word_as_unknown",
    request_body = MarkAsUnknownRequest,
    responses(
        (status = 200, description = "Words marked as unknown successfully"),
        (status = 500, description = "Internal server error")
    )
)]
#[instrument(skip(state, claims, request))]
async fn mark_word_as_unknown(
    State(state): State<ApiState>,
    Extension(claims): Extension<Claims>,
    Json(request): Json<MarkAsUnknownRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!(
        "Marking {} words as unknown for user {}",
        request.word_id, claims.sub
    );

    match state
        .word_release_manager
        .unknown_word(&claims.sub, &request.word_id)
        .await
    {
        Ok(_) => {
            info!(
                "Successfully marked words as unknown for user {}",
                claims.sub
            );
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!(
                "Failed to mark words as unknown for user {}: {}",
                claims.sub, e
            );
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}
