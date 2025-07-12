mod config;
mod environment;
mod llm;
mod rule;
mod user_repository;
mod web_ui;
mod word;

use anyhow::Result;
use axum::{
    http::{
        Method,
        header::{ACCEPT, CONTENT_TYPE, COOKIE},
    },
    routing::get,
};
use clap::Parser;
use llm::LlmService;
use opentelemetry::global;
use opentelemetry_otlp::{Protocol, WithExportConfig};
use opentelemetry_sdk::{Resource, propagation::TraceContextPropagator, trace::SdkTracerProvider};
use std::net::Ipv4Addr;
use tokio::fs;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::EnvFilter;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

use crate::{
    config::Settings,
    rule::{rule_repository, rule_service::RuleService},
    word::{
        set_repository::LearnSetRepository, set_service::SetService,
        word_release_repository::WordReleaseRepository,
    },
};

use crate::{
    environment::{api, auth_api, query},
    web_ui::static_handler,
};

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
    let settings = Settings::load()?;

    let user_repository = user_repository::UserRepository::new().await?;
    let rule_repository = rule_repository::RuleRepository::new().await?;
    let jwt_config = settings.jwt_config();
    let llm_service = LlmService::new(
        settings.openrouter.base_url.clone(),
        settings.openrouter.api_key.clone(),
        settings.openrouter.text_model.clone(),
        settings.openrouter.image_model.clone(),
        settings.openrouter.reasoning_model.clone(),
        settings.openrouter.max_completion_tokens,
    );

    let release_repository = WordReleaseRepository::new().await?;
    let set_repository = LearnSetRepository::new().await?;
    let set_service = SetService::new(
        set_repository.clone(),
        release_repository.clone(),
        llm_service.clone(),
    );

    let rule_service = RuleService::new(rule_repository.clone(), llm_service);

    let open_api_router = OpenApiRouter::new()
        .nest(
            "/api/auth",
            auth_api::jwt_api_router(user_repository, jwt_config.clone()),
        )
        .nest(
            "/api/rule",
            api::set_api_router(rule_service, jwt_config.clone()),
        )
        .nest(
            "/api/rule/query",
            query::query_router(rule_repository.clone(), jwt_config.clone()),
        )
        .nest(
            "/api/word",
            word::api::set_api_router(set_service, jwt_config.clone()),
        )
        .nest(
            "/api/word/query",
            word::query::query_router(set_repository, release_repository, jwt_config.clone()),
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

    if let Some(tls) = &settings.tls {
        use axum_server::tls_rustls::RustlsConfig;
        use std::net::SocketAddr;
        let config = RustlsConfig::from_pem_file(&tls.cert_path, &tls.key_path).await?;
        let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, settings.server.port));
        info!(
            "Server (TLS) listening on {}:{}",
            settings.server.domain, settings.server.port
        );
        axum_server::bind_rustls(addr, config).serve(app).await?;
    } else {
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
    }

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
