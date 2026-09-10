# SOS Sang 229

Plateforme MVP d’alerte et de matching donneur de sang pour le **Hackathon Cursor Bénin** (Bénin).

En cas d’urgence transfusionnelle, un établissement ou un proche peut lancer une alerte. Le système rapproche cette demande des donneurs compatibles à proximité, puis **simule** un SMS par donneur (`SMS_MODE=simulate`, aucun appel Twilio). Le frontend React est branché à l’API FastAPI en local/dev.

## Stack

| Couche | Choix | Statut |
| --- | --- | --- |
| Frontend | React (JavaScript) + Tailwind CSS + Vite | Branché à l’API (`VITE_API_BASE_URL`) |
| Backend | Python FastAPI | Endpoints métier + matching PostGIS |
| Base | PostgreSQL + PostGIS | Docker Compose + migrations Alembic |
| SMS | Twilio | Simulé par défaut (`SMS_MODE=simulate`) |
| Auth | Comptes téléphone + mot de passe, JWT bearer | En place (`JWT_SECRET`) |

## Structure

```
frontend/          # UI Vite + React (+ vercel.json)
backend/           # API FastAPI (+ Dockerfile, start.sh, railway.toml)
docker-compose.yml # Postgres + PostGIS local
.env.example       # noms de variables uniquement
```

## Lancer en local (frontend + API)

Prérequis : Node.js 18+, Python 3.11+, Docker (pour Postgres + PostGIS).

CORS autorise toujours `http://localhost:5173` et `http://127.0.0.1:5173`, plus `FRONTEND_ORIGIN` (une URL ou une liste séparée par des virgules, ex. l’URL Vercel). Le frontend appelle l’API via `VITE_API_BASE_URL` (défaut `http://127.0.0.1:8000`).

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
| `/` | Accueil (contextuel : CTA si déconnecté, menu compte si connecté) |
| `/donneur/inscription` | `POST /auth/register` (si nouveau) + `POST /donors` |
| `/alerte` | `GET /hospitals/recognized` + `POST /auth/register` (si nouveau) + `POST /alerts` |
| `/connexion` | `POST /auth/login` |
| `/mes-demandes` | `GET /me/requests` (auth) — clic → `GET /requests/{public_ref}` |
| `/demandes-en-cours` | `GET /me/matches` (auth) + `POST /donations` |

Santé API : [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) — docs : [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

Détail backend : [backend/README.md](backend/README.md). Détail frontend : [frontend/README.md](frontend/README.md).

Téléphone, GPS et groupe sanguin sont sensibles — ne jamais les logger en clair. Utiliser uniquement des données clairement fictives (`Donneur Demo`, `+22900000001`, `Zone Demo`).

## Plan de test rapide

1. `GET /health` → `{ "status": "ok" }`.
2. Accueil déconnecté → « Devenir donneur ». Remplir nom + téléphone + mot de passe
   (8+) + groupe + zone → compte créé, le bouton au nom apparaît dans l’en-tête.
3. Deuxième compte (autre navigateur / storage vidé) → « Signaler une urgence » :
   nom + téléphone + mot de passe + groupe + patient (initiales) + établissement
   reconnu → écran de confirmation ; la demande apparaît dans **Mes demandes**.
4. Si le premier compte est compatible : **Demandes en cours** la liste →
   « Confirmer mon don » → chez le demandeur, `confirmés +1`, statut « Pourvue »
   si `units_needed` atteint. Deuxième confirm → refusé.
5. `/mes-demandes` déconnecté → redirection `/connexion` ; se reconnecter →
   l’état revient (jeton persistant).
6. `cd backend && .venv/Scripts/python -m pytest -q` OK ; `cd frontend && npm run build` OK.

Hors scope : achat de numéros Twilio, envoi SMS réel, noms de domaine achetés.

## Déploiement (Railway API + Vercel front)

Aucun secret Railway/Vercel dans git. Un équipier crée les projets, branche GitHub, et renseigne les variables dans les dashboards.

### Prérequis

| Cible | Root Directory | Build | Sortie / start |
| --- | --- | --- | --- |
| **Railway — API** | `backend` | Dockerfile (`backend/Dockerfile`, Python 3.12) | `./start.sh` → `alembic upgrade head` puis `uvicorn` sur `$PORT` |
| **Railway — base** | (service image / template) | **PostGIS obligatoire** | Variable `DATABASE_URL` partagée vers l’API |
| **Vercel — front** | `frontend` | `npm run build` | `dist/` + `vercel.json` (SPA → `index.html`) |

Ne pas laisser le Root Directory Railway à la racine du monorepo : Railpack/Nixpacks peut choisir le frontend, et le `COPY requirements.txt` du Dockerfile API échouera.

### 1. Railway — base PostGIS

Le matching GPS utilise `ST_DWithin`. La première migration exécute `CREATE EXTENSION IF NOT EXISTS postgis`. **Un Postgres Railway standard, sans PostGIS, cassera le déploiement.**

Options (choisir une) :

1. Template marketplace **PostGIS** (image type `postgis/postgis` ou template Railway PostGIS) — le plus simple.
2. Image Docker `postgis/postgis:16-3.4` (même famille que `docker-compose.yml`) : New service → Docker Image, volume persistant sur le data dir Postgres, `POSTGRES_PASSWORD` généré par Railway.
3. Template « PostgreSQL with extensions » avec `postgresql-*-postgis-3` et `PG_DB_EXTENSIONS=postgis`.

Puis, sur le **service API** (pas dans git) :

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

(adapte le nom du service : `PostGIS`, `Postgres`, etc.)

Railway peut fournir `postgres://…` : l’API le normalise en `postgresql://`. Préférer l’URL **privée** du projet (même Railway project) plutôt que l’URL publique. N’ajoute `?sslmode=require` que si le prestataire l’exige (souvent l’URL publique).

### 2. Railway — API FastAPI

1. New Project → Deploy from GitHub → ce dépôt.
2. Service settings : **Root Directory = `backend`**. Railway lira `backend/railway.toml` + `backend/Dockerfile`.
3. Generate domain (URL du type `https://….up.railway.app`).
4. Variables (valeurs placeholder ici — coller les vraies dans le dashboard uniquement) :

   | Variable | Exemple / note |
   | --- | --- |
   | `DATABASE_URL` | référence `${{…DATABASE_URL}}` du service PostGIS |
   | `FRONTEND_ORIGIN` | `https://your-app.vercel.app` (sans slash final ; virgules pour plusieurs origins) |
   | `SMS_MODE` | `simulate` (démo jury — pas de Twilio réel) |
   | `APP_ENV` | `production` |
   | `MATCH_RADIUS_METERS` | `15000` (optionnel) |
   | `JWT_SECRET` | **obligatoire** (`APP_ENV=production`) — chaîne aléatoire longue, jamais commitée |
   | `TWILIO_*` | laisser vides |

5. Déployer. Le start script applique les migrations puis lance uvicorn. Santé : `https://….up.railway.app/health` → `{"status":"ok"}`.
6. Alternative dashboard si `railway.toml` n’est pas pris en compte : Builder = Dockerfile, start = `./start.sh`, healthcheck = `/health`.

`start.sh` échoue si `DATABASE_URL` manque ou si PostGIS est absent — c’est voulu.

### 3. Vercel — frontend Vite

1. New Project → importer le même repo GitHub.
2. **Root Directory = `frontend`**. Framework Vite, build `npm run build`, output `dist/`. `frontend/vercel.json` réécrit les routes SPA vers `index.html`.
3. Environment Variables (Production et Preview), **avant** le premier build :

   ```
   VITE_API_BASE_URL=https://your-api.up.railway.app
   ```

   Vite **inline** cette variable au build. Un changement exige un redeploy Vercel.
4. Deploy. Copier l’URL `https://….vercel.app` dans `FRONTEND_ORIGIN` côté Railway, puis redéployer l’API si l’origine n’était pas encore là.
5. Recette CORS : ouvrir le front Vercel, inscription / alerte — pas d’erreur navigateur `blocked by CORS`. Si besoin, ajouter l’URL Preview dans `FRONTEND_ORIGIN` (liste à virgules).

### 4. Seed démo jury (données fictives uniquement)

Après le premier `alembic upgrade head`, charger le jeu **clairement fictif** (`Donneur Demo`, `Hopital Demo`, `+22900000000`, `Zone Demo`, `REQ-DEMO-*`) :

Sur le service API Railway (one-off / shell, working dir `/app`) :

```bash
python scripts/seed_demo.py
```

Ne jamais coller `DATABASE_URL` ni des données réelles dans git, tickets, README ou captures. Le script n’affiche pas téléphone, GPS ni groupe sanguin.

### Ordre conseillé

1. PostGIS Railway → 2. API Railway + `DATABASE_URL` + `JWT_SECRET` + `SMS_MODE=simulate` → 3. Vercel + `VITE_API_BASE_URL` → 4. `FRONTEND_ORIGIN` = URL Vercel → 5. seed démo → 6. parcours `/` → devenir donneur / signaler une urgence → mes demandes / demandes en cours.

## SMS : simulate vs live

| Mode | Quand | Comportement |
| --- | --- | --- |
| `simulate` (défaut) | `SMS_MODE` absent, vide, ou `simulate` | Aucun appel réseau. Un succès simulé est enregistré par donneur matché. |
| `live` | `SMS_MODE=live` **et** `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` tous renseignés | Chemin live sélectionné. Dans ce MVP le send reste un stub local (pas d’HTTP Twilio). |

Si `SMS_MODE=live` sans identifiants, le mode effectif redevient `simulate`.

Dans `.env` (jamais commité) :

```
SMS_MODE=simulate
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

Ne pas logger un numéro complet, un GPS ou un groupe sanguin. Les logs SMS masquent le téléphone (`***0001`). Les lignes `sms_notifications` ne stockent ni téléphone ni corps de message.

## Branches et PR

- Branche de travail : `<type>/<nom-court>` — ex. `init/setup-projet`, `feat/donor-register`.
- Pas de commit direct sur `main` : ouvrir une pull request.
- Types usuels : `init`, `feat`, `fix`, `docs`, `chore`.

## Sécurité

Ne jamais committer de secrets (`.env`, `TWILIO_AUTH_TOKEN`, etc.), ni de données réelles de donneurs (téléphone, GPS, groupe sanguin).
Les jeux de démo doivent rester clairement fictifs. Ne pas logger téléphone, GPS ou groupe sanguin en clair. Le mode SMS live ne s’active pas tout seul.
