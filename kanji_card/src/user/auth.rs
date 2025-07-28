use axum::{
    Json,
    body::Body,
    extract::State,
    http::{HeaderValue, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use base64::{Engine, engine::general_purpose};
use cookie::{Cookie, CookieBuilder, time::Duration as CookieDuration};
use hyper::header::{AUTHORIZATION, COOKIE, HOST, SET_COOKIE};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha512};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tracing::{error, instrument};
use utoipa::ToSchema;

use super::user_repository::UserRepository;

pub const TOKEN_COOKIE_NAME: &str = "auth_token";

#[derive(Deserialize, Serialize, Clone, ToSchema)]
pub struct Claims {
    pub sub: String,
    pub exp: i64,
    pub iat: i64,
}

#[derive(Clone, Debug)]
pub struct JwtConfig {
    pub secret: Vec<u8>,
    pub token_expiry: Duration,
    pub refresh_threshold: Duration,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

pub async fn login(
    user_repo: Arc<UserRepository>,
    jwt_config: Arc<JwtConfig>,
    login: &str,
    password: &str,
) -> Result<Response, Response> {
    let user = user_repo
        .get_user(login)
        .await
        .map_err(|e| {
            error!("Error getting user: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Failed to get user".to_string(),
                }),
            )
                .into_response()
        })?
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "Invalid credentials".to_string(),
                }),
            )
                .into_response()
        })?;

    let hashed_password = hash_password(password, login);
    if user.password_hash != hashed_password {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Invalid credentials".to_string(),
            }),
        )
            .into_response());
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let claims = Claims {
        sub: login.to_owned(),
        exp: now + jwt_config.token_expiry.as_secs() as i64,
        iat: now,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&jwt_config.secret),
    )
    .map_err(|e| {
        error!("Error generating token: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to generate token".to_string(),
            }),
        )
            .into_response()
    })?;

    let mut response = Response::builder()
        .status(StatusCode::OK)
        .body(Body::empty())
        .unwrap();

    set_auth_cookie("localhost", &mut response, &token, &jwt_config);

    Ok(response)
}

pub async fn register(
    user_repo: Arc<UserRepository>,
    login: &str,
    password: &str,
) -> Result<Response, Response> {
    if user_repo
        .get_user(login)
        .await
        .map_err(|e| {
            error!("Error checking user existence: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Failed to check user existence".to_string(),
                }),
            )
                .into_response()
        })?
        .is_some()
    {
        return Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "User already exists".to_string(),
            }),
        )
            .into_response());
    }

    let hashed_password = hash_password(password, login);
    user_repo
        .save_user(login, &hashed_password)
        .await
        .map_err(|e| {
            error!("Error saving user: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Failed to save user".to_string(),
                }),
            )
                .into_response()
        })?;

    Ok(Response::builder()
        .status(StatusCode::CREATED)
        .body(Body::empty())
        .unwrap())
}

pub async fn logout() -> Result<Response, Response> {
    let mut response = Response::builder()
        .status(StatusCode::OK)
        .body(Body::empty())
        .unwrap();

    clear_auth_cookie(&mut response);

    Ok(response)
}

#[instrument(skip(jwt_config, request, next))]
pub async fn auth_middleware(
    State(jwt_config): State<JwtConfig>,
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, Response> {
    let (claims, host, needs_refresh) = check_auth(&jwt_config, &request)?;

    request.extensions_mut().insert(claims.clone());

    let mut response = next.run(request).await;
    if needs_refresh {
        let new_token = generate_token(&jwt_config, &claims)?;
        set_auth_cookie(&host, &mut response, &new_token, &jwt_config);
    }

    Ok(response)
}

fn generate_token(config: &JwtConfig, claims: &Claims) -> Result<String, Response> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let mut new_claims = claims.clone();
    new_claims.iat = now;
    new_claims.exp = now + config.token_expiry.as_secs() as i64;

    encode(
        &Header::default(),
        &new_claims,
        &EncodingKey::from_secret(&config.secret),
    )
    .map_err(|e| {
        error!("Error generating token: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to generate token".to_string(),
            }),
        )
            .into_response()
    })
}

pub fn set_auth_cookie(host: &str, response: &mut Response, token: &str, config: &JwtConfig) {
    // let domain = if host.contains(':') {
    //     host.split(':').next().unwrap_or(host)
    // } else {
    //     host
    // };

    // let is_localhost = domain == "localhost";
    let cookie_builder = CookieBuilder::new(TOKEN_COOKIE_NAME, token)
        // .http_only(true)
        .secure(false)
        // .same_site(if is_localhost {
        //     cookie::SameSite::Lax
        // } else {
        //     cookie::SameSite::Strict
        // })
        .path("/")
        .max_age(CookieDuration::seconds(config.token_expiry.as_secs() as i64));

    // if !is_localhost {
    //     cookie_builder = cookie_builder.domain(format!(".{}", domain));
    // }

    let cookie = cookie_builder.build();

    response.headers_mut().insert(
        SET_COOKIE,
        HeaderValue::from_str(&cookie.to_string()).unwrap(),
    );
}

pub fn clear_auth_cookie(response: &mut Response) {
    let cookie = CookieBuilder::new(TOKEN_COOKIE_NAME, "")
        .path("/")
        .max_age(CookieDuration::seconds(0))
        .build();

    response.headers_mut().insert(
        SET_COOKIE,
        HeaderValue::from_str(&cookie.to_string()).unwrap(),
    );
}

#[instrument(skip(config, request))]
fn check_auth(
    config: &JwtConfig,
    request: &Request<Body>,
) -> Result<(Claims, String, bool), Response> {
    let host = request
        .headers()
        .get(HOST)
        .and_then(|h| h.to_str().ok())
        .unwrap_or_default();

    let token = request
        .headers()
        .get(COOKIE)
        .and_then(|header| header.to_str().ok())
        .and_then(|cookie_str| {
            cookie_str
                .split(';')
                .filter_map(|s| Cookie::parse(s.trim()).ok())
                .find(|cookie| cookie.name() == TOKEN_COOKIE_NAME)
                .map(|cookie| cookie.value().to_string())
        })
        .or_else(|| {
            request
                .headers()
                .get(AUTHORIZATION)
                .and_then(|x| x.to_str().ok())
                .and_then(|x| x.split_once(" ").map(|x| x.1.to_string()))
        })
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "Missing authorization token".to_string(),
                }),
            )
                .into_response()
        })?;

    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = false;

    let token_data = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(&config.secret),
        &validation,
    )
    .map_err(|e| {
        error!("Error decoding token: {}", e);
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Invalid token".to_string(),
            }),
        )
            .into_response()
    })?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let needs_refresh = token_data.claims.exp - now < config.refresh_threshold.as_secs() as i64;
    if token_data.claims.exp < now {
        error!("Token expired: {}", token_data.claims.exp);
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Token expired".to_string(),
            }),
        )
            .into_response());
    }

    Ok((token_data.claims, host.to_owned(), needs_refresh))
}

fn hash_password(password: &str, salt: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(password.as_bytes());
    hasher.update(salt.as_bytes());
    let result = hasher.finalize();
    general_purpose::STANDARD.encode(result)
}
