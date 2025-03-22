# The Trader

## Overview
This project is an automated trading system that fetches market data, makes trading decisions, places orders, and provides analysis. The system is built with multiple microservices, each handling a distinct responsibility.

## Objectives
- Fetch real-time and historical market data.
- Make buy/sell/hold decisions based on predefined strategies.
- Execute orders efficiently while respecting rate limits.
- Store trade logs and market data for future analysis.
- Maintain a scalable and easily migratable architecture.

## Tech Stack
- **Programming Languages**: Python (with an option to migrate to Rust for decision-making in the future)
- **Databases**: PostgreSQL (structured trade data), InfluxDB (time-series market data)
- **Message Queue**: NATS
- **Frontend**: Next.js (for analysis and reporting)
- **Containerization**: Docker Compose for service orchestration

## Directory Structure
```
├── services
│   ├── live_data_consumer    # Service 1A: Fetch live data from WebSocket/API
│   ├── historical_data_provider # Service 1B: Serve historical data
│   ├── decision_maker        # Service 2: Make buy/sell/hold decisions
│   ├── order_placement       # Service 3: Execute trades
│   ├── ui             # Service 4: Next.js dashboard for visualization
├── data                      # Persistent storage for logs and archives
├── configs                   # Configuration files for services
├── docker-compose.yml         # Docker orchestration file
├── .env.example               # Example environment variables
└── README.md                  # Project documentation
```

## Services
### Service 1A: Live Data Consumer
- Connects to market data via WebSocket (or API fallback)
- Publishes live data to NATS for processing
- Caches data for quick access

### Service 1B: Historical Data Provider
- Serves historical data from an archive or API
- Ensures a 1-year data retention policy
- Stores data in InfluxDB and PostgreSQL

### Service 2: Decision Making
- Consumes real-time and historical data
- Uses predefined strategies to decide on trades
- Publishes decisions to the message queue
- Designed to support machine learning models in future

### Service 3: Order Placement
- Receives trade decisions and executes them
- Ensures compliance with rate limits
- Logs transactions in PostgreSQL

### Service 4: UI
- Provides a web dashboard (Next.js)
- Displays trade history, market trends, and performance analytics

## Deployment & Setup
### Prerequisites
- Docker & Docker Compose installed
- API key from a stock brokerage (e.g., Zerodha)

### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/username/the-trader.git
   cd algo-trading
   ```
2. Copy the environment file and configure it:
   ```sh
   cp .env.example .env
   ```
3. Start all services:
   ```sh
   docker-compose up -d --build
   ```
4. Check logs:
   ```sh
   docker-compose logs -f
   ```

## DB Schema

PostgreSQL is maintained for structured data via Prisma ORM. The primary prisma schema to follow is in `services/ui/prisma/schema.prisma`.

## Best Practices
- Keep services modular and stateless where possible.
- Ensure persistent storage for logs and historical data.
- Optimize API/WebSocket usage to minimize costs and latency.

## Future Enhancements
- Implement ML-based decision-making.
- Migrate critical components to Rust for performance.
- Add automated risk management features.

## License
MIT License

