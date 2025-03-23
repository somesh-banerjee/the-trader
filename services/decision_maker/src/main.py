import asyncio
from src.app.nats_consumer import start_nats_listener
import logging

def configure_logging():
    logging.basicConfig(
        level=logging.INFO,  # Set the default log level here
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

if __name__ == "__main__":
    configure_logging()
    
    logging.info("🚀 Starting Decision Making Service...")
    asyncio.run(start_nats_listener())
