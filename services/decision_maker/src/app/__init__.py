import aiohttp
from src.config import HISTORICAL_DATA_URL

async def fetch_historical_data(symbol):
    """Fetch historical price data from Service 1B."""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{HISTORICAL_DATA_URL}/{symbol}") as response:
            return await response.json()
