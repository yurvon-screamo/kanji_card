FROM node:slim AS frontend-builder
WORKDIR /usr/src/frontend
RUN npm config set strict-ssl false
COPY kanji_card_ui/package.json kanji_card_ui/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY kanji_card_ui/ ./
RUN npm run build

FROM rust:slim AS builder
WORKDIR /usr/src/app
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev curl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    update-ca-certificates
COPY kanji_card/ .
COPY --from=frontend-builder /usr/src/frontend/dist ./kanji_card_ui/dist
RUN cargo build --release --workspace --bin kanji_card

FROM debian AS runtime
WORKDIR /app
ENV RUST_LOG=INFO
COPY --from=builder /usr/src/app/target/release/kanji_card /app/kanji_card
RUN apt-get update && \
    apt-get install -y openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 kanji && \
    useradd -u 1001 -g kanji -m -s /bin/bash kanji && \
    chown -R kanji:kanji /app

# USER kanji
EXPOSE 3000
ENTRYPOINT ["/app/kanji_card"]