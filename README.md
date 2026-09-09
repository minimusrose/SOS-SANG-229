# SOS Sang 229

Plateforme MVP d’alerte et de matching donneur de sang pour le **Hackathon Cursor Bénin** (Bénin).

En cas d’urgence transfusionnelle, un établissement ou un proche peut lancer une alerte. Le système rapproche cette demande des donneurs compatibles à proximité (SMS prévu plus tard). Le frontend React est branché à l’API FastAPI en local/dev. Twilio n’est **pas** appelé.

## Stack

| Couche | Choix | Statut |
| --- | --- | --- |
| Frontend | React (JavaScript) + Tailwind CSS + Vite | Branché à l’API (`VITE_API_BASE_URL`) |
| Backend | Python FastAPI | Endpoints métier + matching PostGIS |
| Base | PostgreSQL + PostGIS | Docker Compose + migrations Alembic |
| SMS | Twilio | Prévu (variables placeholder) |
| Auth | JWT | Prévu (variables placeholder) |

## Structure

```
frontend/          # UI Vite + React
backend/           # API FastAPI
docker-compose.yml # Postgres + PostGIS local
.env.example       # noms de variables uniquement
```

## Lancer en local (frontend + API)

Prérequis : Node.js 18+, Python 3.11+, Docker (pour Postgres + PostGIS).

CORS autorise `http://localhost:5173` et `http://127.0.0.1:5173`. Le frontend appelle l’API via `VITE_API_BASE_URL` (défaut `http://127.0.0.1:8000`).

1. Copier `.env.example` vers `.env` à la racine. Y mettre un mot de passe **local** pour `POSTGRES_PASSWORD` et `DATABASE_URL` (jamais commiter `.env`).
2. Copier `frontend/.env.example` vers `frontend/.env` (optionnel si le défaut convient) :

   ```
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

3. Base + migrations + seed fictif :

   ```bash
   docker compose up -d
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   python scripts/seed_demo.py
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Dans un second terminal :

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Ouvre [http://localhost:5173](http://localhost:5173) (ou [http://127.0.0.1:5173](http://127.0.0.1:5173)).

| Route | Parcours |
| --- | --- |
| `/` | Accueil |
| `/donneur/inscription` | `POST /donors` |
| `/alerte` | `GET /hospitals/recognized` + `POST /alerts` |
| `/suivi` | `GET /requests` |
| `/suivi/:publicRef` | `GET /requests/{public_ref}` + `POST /donations` |

Santé API : [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) — docs : [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

Détail backend : [backend/README.md](backend/README.md). Détail frontend : [frontend/README.md](frontend/README.md).

Téléphone, GPS et groupe sanguin sont sensibles — ne jamais les logger en clair. Utiliser uniquement des données clairement fictives (`Donneur Demo`, `+22900000001`, `Zone Demo`).

## Plan de test rapide

1. `GET /health` → `{ "status": "ok" }`.
2. Inscription donneur : nom `Donneur Demo`, groupe `O+`, téléphone `+22900000001`, ville `Zone Demo` → toast succès, pas de téléphone affiché.
3. Alerte : patient `Patient Demo`, hôpital reconnu chargé depuis l’API, groupe `O+` → `public_ref` + nombre de donneurs alertés.
4. Suivi : la nouvelle référence apparaît ; le détail montre groupe / patient / compteurs.
5. Confirmer le don depuis l’alerte ou le suivi → compteur confirmé, statut pourvue si unités atteintes.
6. État vide : filtre sans lignes, ou API arrêtée → message d’erreur, pas de stubs `REQ-DEMO-*`.
7. `cd frontend && npm run build` OK.

Hors scope : SMS Twilio réel, JWT, déploiement Vercel.

## Branches et PR

- Branche de travail : `<type>/<nom-court>` — ex. `init/setup-projet`, `feat/donor-register`.
- Pas de commit direct sur `main` : ouvrir une pull request.
- Types usuels : `init`, `feat`, `fix`, `docs`, `chore`.

## Sécurité

Ne jamais committer de secrets (`.env`), ni de données réelles de donneurs (téléphone, GPS, groupe sanguin).
Les jeux de démo doivent rester clairement fictifs. Ne pas logger téléphone, GPS ou groupe sanguin en clair.
