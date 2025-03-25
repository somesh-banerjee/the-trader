from fastapi import FastAPI
from src.api.endpoints import router

app = FastAPI(title="Market Data Service", version="1.0")

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
