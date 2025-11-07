FROM rust:1.91-slim AS builder

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY . .

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release/secular /usr/local/bin/
COPY --from=builder /build/target/release/sec /usr/local/bin/

RUN secular --version

ENTRYPOINT ["secular"]
