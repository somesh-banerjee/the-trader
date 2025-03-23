import asyncio
from src.app.nats_consumer import start_nats_listener

if __name__ == "__main__":
    print("🚀 Starting Decision Making Service...")
    asyncio.run(start_nats_listener())
