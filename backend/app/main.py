from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import alerts, donors, health, tracking

app = FastAPI(
    title="SOS Sang 229 API",
    description="MVP d’alerte donneur de sang — Hackathon Cursor Bénin. Schéma ORM + stubs HTTP.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(donors.router)
app.include_router(alerts.router)
app.include_router(tracking.router)


@app.get("/")
def root():
    return {"service": "sos-sang-229", "docs": "/docs", "health": "/health"}
