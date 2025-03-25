from fastapi import APIRouter, HTTPException
from src.services.influx_reader import InfluxReader

router = APIRouter()
db_reader = InfluxReader()

@router.get("/market_data")
def get_market_data(symbol: str, start_date: str, end_date: str):
    try:
        data = db_reader.fetch_market_data(symbol, start_date, end_date)
        if not data:
            raise HTTPException(status_code=404, detail="No data found")
        return {"symbol": symbol, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
