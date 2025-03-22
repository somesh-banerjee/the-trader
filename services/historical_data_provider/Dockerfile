FROM rust:1.74 as builder
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
RUN cargo fetch

COPY src ./src
RUN cargo build --release

FROM debian:bullseye-slim
WORKDIR /app
COPY --from=builder /app/target/release/historical_data_provider .

CMD ["./historical_data_provider"]
