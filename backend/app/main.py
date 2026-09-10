from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.matching import DEFAULT_RADIUS_METERS
from app.routers import alerts, donations, donors, health, hospitals, tracking

app = FastAPI(
    title="SOS Sang 229 API",
    description=(
        "MVP d’alerte et de matching donneur de sang — Hackathon Cursor Bénin.\n\n"
        "## Endpoints métier\n"
        "- `GET /health` — santé de l’API (sans base)\n"
        "- `GET /hospitals` / `GET /hospitals/recognized` — établissements reconnus "
        "(sans téléphone ni GPS)\n"
        "- `POST /donors` — inscription donneur (téléphone / GPS omis en réponse)\n"
        "- `POST /alerts` — créer une urgence (`hospital_id` reconnu obligatoire), "
        "lancer le matching, simuler un SMS par donneur (`SMS_MODE=simulate`)\n"
        "- `POST /donations` — confirmer un don\n"
        "- `GET /requests` et `GET /requests/{public_ref}` — suivi (compteurs / statut, "
        "sans numéro de téléphone)\n\n"
        "## Matching PostGIS\n"
        f"Rayon GPS par défaut : **{DEFAULT_RADIUS_METERS} m (15 km)**, "
        "configurable via `MATCH_RADIUS_METERS`. "
        "Si l’hôpital et le donneur ont un point GPS : `ST_DWithin` (geography, mètres). "
        "Sinon : même ville (comparaison insensible à la casse). "
        "Groupes compatibles ABO/Rh. Donneurs `is_available=true` uniquement.\n\n"
        "SMS : mode `simulate` par défaut (aucun appel Twilio). "
        "Le mode live reste off sauf `SMS_MODE=live` et identifiants présents "
        "(chemin stub, pas d’HTTP). JWT : non requis pour ce MVP. "
        "Ne jamais logger téléphone, GPS ou groupe sanguin en clair."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(hospitals.router)
app.include_router(donors.router)
app.include_router(alerts.router)
app.include_router(donations.router)
app.include_router(tracking.router)


@app.get("/")
def root():
    return {
        "service": "sos-sang-229",
        "docs": "/docs",
        "health": "/health",
        "endpoints": [
            "/health",
            "/hospitals",
            "/hospitals/recognized",
            "/donors",
            "/alerts",
            "/donations",
            "/requests",
            "/requests/{public_ref}",
        ],
    }
