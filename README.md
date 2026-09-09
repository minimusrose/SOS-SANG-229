# SOS Sang 229

Plateforme MVP d’alerte et de matching donneur de sang pour le **Hackathon Cursor Bénin** (Bénin).

En cas d’urgence transfusionnelle, un établissement ou un proche peut lancer une alerte. Le système vise à rapprocher rapidement cette demande des donneurs compatibles à proximité (SMS prévu). Ce dépôt est le socle monorepo du MVP : le frontend est une **maquette statique** (pas d’API branchée) ; le backend reste un squelette.

## Stack

| Couche | Choix | Statut |
| --- | --- | --- |
| Frontend | React (JavaScript) + Tailwind CSS + Vite | Maquette statique (4 écrans) |
| Backend | Python FastAPI | Scaffold (`GET /health`) |
| Base | PostgreSQL + PostGIS | Prévu (stub Docker uniquement) |
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

Copier `.env.example` vers `.env` si besoin. Aucune valeur secrète n’est requise pour ce scaffold.

### Postgres + PostGIS (optionnel, plus tard)

```bash
docker compose up -d
```

L’API n’utilise pas encore cette base. Définir `POSTGRES_PASSWORD` dans un `.env` local (non commité).

## Branches et PR

- Branche de travail : `<type>/<nom-court>` — ex. `init/setup-projet`, `feat/donor-register`.
- Pas de commit direct sur `main` : ouvrir une pull request.
- Types usuels : `init`, `feat`, `fix`, `docs`, `chore`.

## Sécurité

Ne jamais committer de secrets (`.env`), ni de données réelles de donneurs (téléphone, GPS, groupe sanguin).
Les jeux de démo doivent rester clairement fictifs. Ne pas logger téléphone, GPS ou groupe sanguin en clair.
