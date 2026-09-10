from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.matching import DEFAULT_RADIUS_METERS
from app.routers import (
    alerts,
    auth,
    donations,
    donors,
    health,
    hospitals,
    me,
    tracking,
)

app = FastAPI(
    title="SOS Sang 229 API",
    description=(
        "MVP d’alerte et de matching donneur de sang — Hackathon Cursor Bénin.\n\n"
        "## Endpoints métier\n"
        "- `GET /health` — santé de l’API (sans base)\n"
        "- `POST /auth/register` / `POST /auth/login` / `GET /auth/me` — comptes "
        "(téléphone + mot de passe, JWT bearer)\n"
        "- `GET /hospitals` / `GET /hospitals/recognized` — établissements reconnus "
        "(sans téléphone ni GPS)\n"
        "- `POST /donors` — profil donneur du compte connecté (téléphone du compte)\n"
        "- `POST /alerts` — créer une urgence (compte connecté), `hospital_id` "
        "reconnu obligatoire, matching + SMS simulé\n"
        "- `POST /donations` — confirmer son don (compte connecté, doit être matché)\n"
        "- `GET /me/requests` — mes demandes ; `GET /me/matches` — demandes où je "
        "suis compatible\n"
        "- `GET /requests/{public_ref}` — détail d’une demande (demandeur ou "
        "donneur matché uniquement)\n\n"
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
app.include_router(auth.router)
app.include_router(hospitals.router)
app.include_router(donors.router)
app.include_router(alerts.router)
app.include_router(donations.router)
app.include_router(me.router)
app.include_router(tracking.router)


@app.get("/")
def root():
    return {
        "service": "sos-sang-229",
        "docs": "/docs",
        "health": "/health",
        "endpoints": [
            "/health",
            "/auth/register",
            "/auth/login",
            "/auth/me",
            "/hospitals",
            "/hospitals/recognized",
            "/donors",
            "/alerts",
            "/donations",
            "/me/requests",
            "/me/matches",
            "/requests/{public_ref}",
        ],
    }
