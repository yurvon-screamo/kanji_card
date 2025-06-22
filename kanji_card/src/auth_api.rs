use std::sync::Arc;

use axum::{Json, extract::State, response::IntoResponse};
use serde::{Deserialize, Serialize};
use tracing::{error, info, instrument};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{auth::JwtConfig, user_repository::UserRepository};

#[derive(Clone)]
struct AuthApiState {
    repository: Arc<UserRepository>,
    jwt_config: Arc<JwtConfig>,
}

pub fn jwt_api_router(user_repo: UserRepository, jwt_config: JwtConfig) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(login))
        .routes(routes!(register))
        .routes(routes!(logout))
        .with_state(AuthApiState {
            repository: Arc::new(user_repo),
            jwt_config: Arc::new(jwt_config),
        })
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

#[utoipa::path(
    post,
    path = "/api/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful"),
        (status = 401, description = "Invalid credentials"),
        (status = 500, description = "Internal server error")
    ),
    tag = "auth"
)]
#[instrument(skip(state, credentials))]
async fn login(
    State(state): State<AuthApiState>,
    Json(credentials): Json<LoginRequest>,
) -> impl IntoResponse {
    info!("Login attempt for user {}", credentials.login);
    let response = crate::auth::login(
        state.repository,
        state.jwt_config,
        &credentials.login,
        &credentials.password,
    )
    .await;

    match &response {
        Ok(_) => {
            info!("Successful login for user {}", credentials.login);
            response
        }
        Err(e) => {
            error!(
                "Failed login attempt for user {}: {}",
                credentials.login,
                e.status()
            );
            response
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/auth/logout",
    responses(
        (status = 200, description = "Logout successful"),
        (status = 500, description = "Internal server error")
    ),
    tag = "auth"
)]
#[instrument(skip(state))]
async fn logout(State(state): State<AuthApiState>) -> impl IntoResponse {
    info!("Logout request");
    let response = crate::auth::logout(state.jwt_config).await;

    match &response {
        Ok(_) => {
            info!("Successful logout");
            response
        }
        Err(e) => {
            error!("Failed logout: {}", e.status());
            response
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 201, description = "User created successfully"),
        (status = 409, description = "User already exists"),
        (status = 500, description = "Internal server error")
    ),
    tag = "auth"
)]
#[instrument(skip(state, credentials))]
async fn register(
    State(state): State<AuthApiState>,
    Json(credentials): Json<RegisterRequest>,
) -> impl IntoResponse {
    info!("Registration attempt for user {}", credentials.login);
    let response =
        crate::auth::register(state.repository, &credentials.login, &credentials.password).await;

    match &response {
        Ok(_) => {
            info!("Successful registration for user {}", credentials.login);
            response
        }
        Err(e) => {
            error!(
                "Failed registration attempt for user {}: {}",
                credentials.login,
                e.status()
            );
            response
        }
    }
}
