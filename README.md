# SOS Sang 229

Plateforme MVP d’alerte et de matching donneur de sang pour le **Hackathon Cursor Bénin** (Bénin).

En cas d’urgence transfusionnelle, un établissement ou un proche peut lancer une alerte. Le système rapproche cette demande des donneurs compatibles à proximité (SMS prévu plus tard). Le frontend est encore une **maquette statique** (pas branchée à l’API). Le backend expose les endpoints métier + matching PostGIS.

## Stack

| Couche | Choix | Statut |
| --- | --- | --- |
| Frontend | React (JavaScript) + Tailwind CSS + Vite | Maquette statique (4 écrans) |
| Backend | Python FastAPI | Endpoints métier + matching PostGIS |
| Base | PostgreSQL + PostGIS | Docker Compose + migrations Alembic |
| SMS | Twilio | Prévu (variables placeholder) |
| Auth | JWT | Prévu (variables placeholder) |

## Structure

```
frontend/          # UI Vite + React
backend/           # API FastAPI
docker-compose.yml # Postgres + PostGIS local (non branché à l’API)
.env.example       # noms de variables uniquement
```

## Lancer en local

Prérequis : Node.js 18+, Python 3.11+, (optionnel) Docker.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173). Routes maquette :

- `/` — accueil
- `/donneur/inscription` — inscription donneur
- `/alerte` — alerte urgence
- `/suivi` — suivi des demandes

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Santé : [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Docs : [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Hôpitaux reconnus : `GET /hospitals/recognized`
- Donneur : `POST /donors`
- Alerte + matching : `POST /alerts`
- Confirmation : `POST /donations`
- Suivi : `GET /requests/{public_ref}`

Rayon GPS par défaut : **15 km**. Exemples curl : [backend/README.md](backend/README.md).

Copier `.env.example` vers `.env` et y mettre `DATABASE_URL` / `POSTGRES_PASSWORD` locaux (non commités) pour les migrations.

### Postgres + PostGIS et migrations

```bash
docker compose up -d
cd backend
source .venv/bin/activate
alembic upgrade head
# optionnel, données fictives uniquement :
python scripts/seed_demo.py
```

Détail : [backend/README.md](backend/README.md). Téléphone, GPS et groupe sanguin sont des champs sensibles — ne jamais les logger en clair.

## Branches et PR

- Branche de travail : `<type>/<nom-court>` — ex. `init/setup-projet`, `feat/donor-register`.
- Pas de commit direct sur `main` : ouvrir une pull request.
- Types usuels : `init`, `feat`, `fix`, `docs`, `chore`.

## Sécurité

Ne jamais committer de secrets (`.env`), ni de données réelles de donneurs (téléphone, GPS, groupe sanguin).
Les jeux de démo doivent rester clairement fictifs. Ne pas logger téléphone, GPS ou groupe sanguin en clair.
