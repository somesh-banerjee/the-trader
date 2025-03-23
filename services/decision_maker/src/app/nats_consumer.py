import asyncio
import nats
from src.app.decision_engine import make_decision
from src.app.historical_data_client import fetch_historical_data
from src.config import NATS_URL, ORDER_TOPIC, MARKET_DATA_TOPIC

async def handle_market_data(msg):
    """Process incoming market data from NATS."""
    data = msg.data.decode()
    symbol, price = data.split(",")
    price = float(price)

    # Fetch historical data from Service 1B
    history = await fetch_historical_data(symbol)

    # Run strategy
    decision = make_decision(symbol, price, history)

    if decision:
        nc = await nats.connect(NATS_URL)
        await nc.publish(ORDER_TOPIC, f"{symbol},{decision}".encode())
        await nc.close()

async def start_nats_listener():
    nc = await nats.connect(NATS_URL)
    await nc.subscribe(MARKET_DATA_TOPIC, cb=handle_market_data)

    while True:
        await asyncio.sleep(1)
