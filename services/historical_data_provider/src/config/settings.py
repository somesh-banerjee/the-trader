import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "your-token")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "prices")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
