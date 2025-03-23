import os

NATS_URL = os.getenv("NATS_URL", "nats://localhost:4222")
HISTORICAL_SERVICE_URL = os.getenv("HISTORICAL_SERVICE_URL", "http://historical_data_provider:8000")
MARKET_DATA_TOPIC = os.getenv("MARKET_DATA_TOPIC", "live_price_updates")
ORDER_TOPIC = os.getenv("ORDER_TOPIC", "trade_orders")