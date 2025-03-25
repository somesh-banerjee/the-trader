from influxdb_client import InfluxDBClient
import pandas as pd
from src.config.settings import INFLUXDB_URL, INFLUXDB_TOKEN, INFLUXDB_ORG, INFLUXDB_BUCKET
from src.utils.logger import logger

class InfluxReader:
    def __init__(self):
        try:
            self.client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
            self.query_api = self.client.query_api()
            logger.info("Connected to InfluxDB successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to InfluxDB: {e}")

    def fetch_market_data(self, symbol: str, start_date: str, end_date: str):
        query = f"""
        from(bucket: "{INFLUXDB_BUCKET}")
        |> range(start: {start_date}, stop: {end_date})
        |> filter(fn: (r) => r["symbol"] == "{symbol}")
        """
        try:
            tables = self.query_api.query(query, org=INFLUXDB_ORG)
            data = []
            for table in tables:
                for record in table.records:
                    data.append({"time": record.get_time(), "price": record.get_value()})

            df = pd.DataFrame(data)
            df['time'] = pd.to_datetime(df['time'])
            
            # Aggregate into OHLC
            df.set_index('time', inplace=True)
            ohlc_data = df['price'].resample('1D').ohlc()
            ohlc_data = ohlc_data.reset_index()

            logger.info(f"Fetched market data for {symbol} from {start_date} to {end_date}")
            return ohlc_data.to_dict(orient="records")

        except Exception as e:
            logger.error(f"Error fetching data from InfluxDB: {e}")
            return []
