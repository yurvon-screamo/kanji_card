mod application;
mod domain;
mod environment;
mod llm;
mod rule_repository;
mod user_repository;
mod web_ui;
mod word_release_repository;
mod word_repository;

use anyhow::Result;
use application::{rule_service::RuleService, set_service::SetService};
use axum::{
    http::{
        Method,
        header::{ACCEPT, CONTENT_TYPE, COOKIE},
    },
    routing::get,
};
use clap::Parser;
use config::Config;
use llm::LlmService;
use opentelemetry::global;
use opentelemetry_otlp::{Protocol, WithExportConfig};
use opentelemetry_sdk::{Resource, propagation::TraceContextPropagator, trace::SdkTracerProvider};
use serde::Deserialize;
use std::{net::Ipv4Addr, time::Duration};
use tokio::fs;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::EnvFilter;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;
use word_repository::WordRepository;

use crate::{
    environment::{api, auth, auth_api, query},
    web_ui::static_handler,
    word_release_repository::WordReleaseRepository,
};

#[derive(Debug, Deserialize)]
struct ServerConfig {
    domain: String,
    port: u16,
}

#[derive(Debug, Deserialize)]
struct OpenRouterConfig {
    base_url: String,
    api_key: String,
    model: String,
}

#[derive(Debug, Deserialize)]
struct JwtConfig {
    secret_key: String,
    token_expiry: u64,
    refresh_threshold: u64,
}

#[derive(Debug, Deserialize)]
struct Settings {
    server: ServerConfig,
    openrouter: OpenRouterConfig,
    jwt: JwtConfig,
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(long)]
    generate_openapi: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    init_tracing()?;

    let args = Args::parse();
    let settings = Config::builder()
        .add_source(config::File::with_name("config"))
        .build()?
        .try_deserialize::<Settings>()?;

    let set_repository = WordRepository::new().await?;
    let release_repository = WordReleaseRepository::new().await?;
    let user_repository = user_repository::UserRepository::new().await?;
    let rule_repository = rule_repository::RuleRepository::new().await?;
    let jwt_config = auth::JwtConfig {
        secret: settings.jwt.secret_key.as_bytes().to_vec(),
        token_expiry: Duration::from_secs(settings.jwt.token_expiry),
        refresh_threshold: Duration::from_secs(settings.jwt.refresh_threshold),
    };
    let llm_service = LlmService::new(
        settings.openrouter.base_url.clone(),
        settings.openrouter.api_key.clone(),
        settings.openrouter.model.clone(),
    );
    let set_service = SetService::new(
        set_repository.clone(),
        release_repository.clone(),
        llm_service.clone(),
    );
    let rule_service = RuleService::new(rule_repository.clone(), llm_service);

    let open_api_router = OpenApiRouter::new()
        .nest(
            "/api/set",
            api::set_api_router(set_service, rule_service, jwt_config.clone()),
        )
        .nest(
            "/api/auth",
            auth_api::jwt_api_router(user_repository, jwt_config.clone()),
        )
        .nest(
            "/api/query",
            query::query_router(set_repository, release_repository, rule_repository.clone(), jwt_config.clone()),
        );

    let (router, mut api) = open_api_router.split_for_parts();
    api.info.title = "cards".to_owned();
    api.info.contact = None;
    api.info.license = None;
    api.info.description = None;
    api.info.version = "v1".to_owned();

    if args.generate_openapi {
        let openapi_json = api.to_json()?;
        fs::write("openapi.json", openapi_json).await?;
        info!("OpenAPI documentation generated successfully");
        return Ok(());
    }

    let cors = CorsLayer::new()
        .allow_origin(["http://localhost:3000".parse()?])
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::OPTIONS,
            Method::PUT,
            Method::DELETE,
            Method::PATCH,
        ])
        .allow_headers([ACCEPT, CONTENT_TYPE, COOKIE])
        .allow_credentials(true);

    let app = router
        .merge(SwaggerUi::new("/swagger").url("/api/openapi.json", api))
        .route("/", get(static_handler))
        .route("/index.html", get(static_handler))
        .route("/{*file}", get(static_handler))
        .layer(cors)
        .with_state(())
        .into_make_service();

    let listener = tokio::net::TcpListener::bind(format!(
        "{}:{}",
        Ipv4Addr::UNSPECIFIED,
        settings.server.port
    ))
    .await?;
    info!(
        "Server listening on {}:{}",
        settings.server.domain, settings.server.port
    );
    axum::serve(listener, app).await?;

    Ok(())
}

fn init_tracing() -> Result<()> {
    global::set_text_map_propagator(TraceContextPropagator::new());

    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_http()
        .with_protocol(Protocol::Grpc)
        .build()?;
    let provider = SdkTracerProvider::builder()
        .with_resource(Resource::builder().with_service_name("kanri").build())
        .with_simple_exporter(exporter)
        .build();

    global::set_tracer_provider(provider.clone());
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    Ok(())
}
