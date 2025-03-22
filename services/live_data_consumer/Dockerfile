# Use a lightweight Rust base image
FROM rust:1.74 as builder

# Set working directory
WORKDIR /app

# Copy Cargo files first to cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN cargo fetch

# Copy source code and build
COPY src ./src
RUN cargo build --release

# Use a smaller runtime image
FROM debian:bullseye-slim
WORKDIR /app
COPY --from=builder /app/target/release/live_data_consumer .

CMD ["./live_data_consumer"]
