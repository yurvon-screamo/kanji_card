use axum::{
    http::{StatusCode, Uri, header},
    response::{IntoResponse, Response},
};
use rust_embed::Embed;
use tracing::info;

#[derive(Embed)]
#[folder = "../kanji_card_ui/dist"]
struct StaticAsset;

pub struct StaticFile<T>(pub T);

impl<T> IntoResponse for StaticFile<T>
where
    T: Into<String>,
{
    fn into_response(self) -> Response {
        let path = self.0.into();
        match StaticAsset::get(path.as_str()) {
            Some(content) => {
                let mime = mime_guess::from_path(path).first_or_octet_stream();
                let mut response =
                    ([(header::CONTENT_TYPE, mime.as_ref())], content.data).into_response();

                if mime.type_() == "image" {
                    let headers = response.headers_mut();
                    headers.insert(
                        header::CACHE_CONTROL,
                        "public, max-age=2592000".parse().unwrap(),
                    ); // 30 days
                    headers.insert(header::EXPIRES, "2592000".parse().unwrap());
                }

                response
            }
            None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
        }
    }
}

pub async fn static_handler(uri: Uri) -> Response {
    let path = uri.path().trim_start_matches('/').to_string();

    if path.starts_with("api/") {
        return (StatusCode::NOT_FOUND, "API routes are handled separately").into_response();
    }

    if !path.is_empty() && !path.ends_with('/') && StaticAsset::get(path.as_str()).is_some() {
        return StaticFile(path).into_response();
    } else {
        info!("Static file not found: {}", path);
    }

    StaticFile("index.html").into_response()
}
