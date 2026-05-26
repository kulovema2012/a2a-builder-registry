FROM rust:1.88-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Dependency cache layer
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && \
    cargo build --release 2>/dev/null || true && \
    rm -rf src

# Build with offline SQLx query cache (no DB required at build time)
COPY .sqlx .sqlx
COPY src src
COPY migrations migrations
ENV SQLX_OFFLINE=true
# touch main.rs so Cargo sees the source changed vs the dummy binary
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/api-rs /usr/local/bin/api-rs

ENV RUST_LOG=info
EXPOSE 8000
CMD ["api-rs"]
