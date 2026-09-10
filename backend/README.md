# Backend — SOS Sang 229

API FastAPI : comptes (téléphone + mot de passe, JWT), profil donneur, hôpitaux
reconnus, alerte + matching PostGIS, confirmation de don, vues personnelles
(mes demandes / demandes compatibles). Point d’entrée : `app/main.py`.

## Lancer l’API

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Lancer ces commandes depuis le dossier `backend/`.

- Santé : [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Docs OpenAPI : [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

`GET /health` fonctionne sans base. Les routes métier exigent `DATABASE_URL`.

## Postgres + PostGIS et migrations

La base locale est le service `db` de `docker-compose.yml` (`postgis/postgis:16-3.4`).
L’extension PostGIS est activée par la première migration Alembic.

1. À la racine du dépôt, copier `.env.example` vers `.env` (jamais commité).
2. Définir un mot de passe local dans `.env`, par exemple :

   ```
   POSTGRES_PASSWORD=changeme_local_only
   DATABASE_URL=postgresql://sos_sang:changeme_local_only@127.0.0.1:5432/sos_sang_229
   MATCH_RADIUS_METERS=15000
   SMS_MODE=simulate
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   Utiliser uniquement des identifiants locaux fictifs. Ne pas y mettre de secrets de production.

3. Démarrer Postgres :

   ```bash
   docker compose up -d
   ```

4. Depuis `backend/`, avec le venv activé :

   ```bash
   alembic upgrade head
   ```

Seed optionnel (données **clairement fictives** seulement : `Donneur Demo`, `+22900000000`, `Zone Demo`, `REQ-DEMO-*`) :

```bash
python scripts/seed_demo.py
```

Le script n’affiche jamais téléphone, GPS ni groupe sanguin.

Revenir en arrière (détruit les tables MVP, laisse l’extension PostGIS) :

```bash
alembic downgrade base
```

### Équivalent sans Docker

Une instance PostgreSQL 16 avec PostGIS et `DATABASE_URL` pointant dessus suffit.
Puis `alembic upgrade head` comme ci-dessus.

## Matching

Service : `app/matching.py`.

| Règle | Comportement |
| --- | --- |
| Compatibilité | ABO/Rh classique (ex. `O-` → tous ; un besoin `O+` accepte `O-` et `O+`) |
| Disponibilité | `donors.is_available = true` uniquement |
| GPS | Si l’hôpital **et** le donneur ont un `location` : `ST_DWithin` (geography, mètres) |
| Rayon par défaut | **15 000 m (15 km)**, via `MATCH_RADIUS_METERS` |
| Repli ville | Si le GPS manque d’un côté : même `city` (insensible à la casse) |
| Persistance | `urgency_matches` (`match_method` = `gps` \| `city`) + `alerted_donors_count` |

Aucun log de téléphone, GPS ou groupe sanguin. Après le matching, `POST /alerts`
appelle `send_urgency_sms` pour chaque donneur (`app/notifications.py`).
Le défaut est `SMS_MODE=simulate` : succès simulé, **aucun** appel Twilio.
Le mode live reste off sauf `SMS_MODE=live` **et** identifiants `TWILIO_*`
présents (chemin stub, pas d’HTTP). Les outcomes sont persistés dans
`sms_notifications` (sans téléphone ni corps de message).

Une urgence **doit** cibler `hospitals.is_recognized = true` (`app.rules.require_recognized_hospital`
+ trigger Postgres `trg_urgency_recognized_hospital`).

## Endpoints

| Méthode | Chemin | Rôle | Auth |
| --- | --- | --- | --- |
| `GET` | `/health` | Santé | — |
| `POST` | `/auth/register` | Créer un compte (téléphone + mot de passe) → `{ token, user }` | — |
| `POST` | `/auth/login` | Se connecter → `{ token, user }` | — |
| `GET` | `/auth/me` | Compte courant | Bearer |
| `GET` | `/hospitals` / `/hospitals/recognized` | Hôpitaux reconnus | — |
| `POST` | `/donors` | Profil donneur du compte connecté (téléphone pris sur le compte) | Bearer |
| `POST` | `/alerts` | Créer une urgence + matching (rattachée au compte) | Bearer |
| `POST` | `/donations` | Confirmer **son** don (doit être matché) | Bearer |
| `GET` | `/me/requests` | Mes demandes | Bearer |
| `GET` | `/me/matches` | Demandes où je suis compatible (avec `i_confirmed`) | Bearer |
| `GET` | `/requests/{public_ref}` | Détail d’une demande (demandeur ou donneur matché) | Bearer |

Les réponses **n’incluent pas** les numéros de téléphone (hors `phone` du compte
pour son propre `/auth/me`) ni le GPS.

Auth : comptes **téléphone + mot de passe**, jeton **JWT bearer**
(`Authorization: Bearer <token>`). `JWT_SECRET` est requis en production
(`APP_ENV=production`) ; vide en local, une clé de secours *dev-only* est utilisée.

## Exemples curl (données fictives, sans secrets)

Après `alembic upgrade head` et éventuellement `python scripts/seed_demo.py`.

```bash
# Santé (sans base)
curl -s http://127.0.0.1:8000/health

# Créer un compte → récupérer le token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+22900000123","password":"motdepasse","display_name":"Awa K."}' \
  | python -c 'import sys,json;print(json.load(sys.stdin)["token"])')

# Hôpitaux reconnus (public)
curl -s http://127.0.0.1:8000/hospitals/recognized

# Profil donneur du compte (téléphone pris sur le compte)
curl -s -X POST http://127.0.0.1:8000/donors \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"blood_group":"O+","city":"Cotonou"}'

# Alerte : remplacer HOSPITAL_ID par un id renvoyé par /hospitals/recognized
curl -s -X POST http://127.0.0.1:8000/alerts \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"public_ref":"REQ-DEMO-API","blood_group_needed":"O+","patient_display_name":"A. K.","hospital_id":"HOSPITAL_ID","zone_label":"Cotonou"}'

# Mes demandes / mes compatibilités
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/me/requests
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/me/matches

# Confirmer son don (le compte doit avoir un profil donneur et être matché)
curl -s -X POST http://127.0.0.1:8000/donations \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"urgency_request_id":"URGENCY_ID"}'
```

Le seed expose `Hopital Demo` (`00000000-0000-4000-8000-000000000010`) et
`REQ-DEMO-001` s’il a déjà été inséré. `Clinique Demo Non Reconnue` doit être
refusée par `POST /alerts`.

## Tests

```bash
cd backend
python -m pytest
```

Pytest couvre le matching (compatibilité, rayon GPS, repli ville), la règle
hôpital reconnu, la chaîne Alembic, et les endpoints clés avec des données
fictives uniquement (SQLite en mémoire, sans secrets). Le chemin PostGIS
(`ST_DWithin`) est exercé en production / Docker ; les tests utilisent le
repli Python (mêmes règles GPS / ville).

## Schéma MVP

| Table | Rôle produit | Champs sensibles |
| --- | --- | --- |
| `donors` | User / Donneur | `phone`, `blood_group`, `location` (GPS PostGIS) |
| `hospitals` | Établissement | `contact_phone`, `location` |
| `urgency_requests` | Urgence / alerte (`hospital_id` FK uniquement) | `blood_group_needed`, `patient_display_name` (démo uniquement) |
| `urgency_matches` | Candidats matchés (`gps` / `city`) | — (pas de téléphone / GPS / groupe) |
| `sms_notifications` | Résultat SMS par donneur (`simulate` / stub live) | — (pas de téléphone / corps / groupe) |
| `donation_confirmations` | Confirmation de don | lie donneur + urgence (`confirmed_at`, `status`) |

### Hôpitaux reconnus

Une urgence ne peut cibler **que** un établissement avec `hospitals.is_recognized = true`.

- Défaut colonne : **`false`**.
- Pas de nom d’hôpital en texte libre sur `urgency_requests` : uniquement `hospital_id`.
- Le seed marque `Hopital Demo` comme reconnu et ajoute `Clinique Demo Non Reconnue`.
- Helper : `app.rules.require_recognized_hospital`. Trigger : `trg_urgency_recognized_hospital`.

## Dossiers

```
app/
  main.py           # application FastAPI
  config.py         # DATABASE_URL + FRONTEND_ORIGIN (CORS) + SMS_MODE / TWILIO_*
  matching.py       # compatibilité + PostGIS / repli ville
  notifications.py  # SMS simulate (live stub gated)
  routers/          # health, hospitals, donors, alerts, donations, tracking
  models/           # ORM SQLAlchemy + PostGIS
  schemas/          # Pydantic create/read/public
alembic/            # migrations
scripts/seed_demo.py
start.sh            # Railway: alembic upgrade head + uvicorn
Dockerfile
railway.toml
tests/              # pytest
```

Auth JWT bearer (téléphone + mot de passe). Twilio live n’est pas appelé en défaut/dev.

## Déploiement Railway

Image : `backend/Dockerfile` (Python 3.12). Entrée : `start.sh` (`alembic upgrade head` puis uvicorn sur `$PORT`).

**Root Directory Railway = `backend`.** Config : `railway.toml`. La base doit être **PostGIS** (pas un Postgres nu). CORS : `FRONTEND_ORIGIN` + localhost Vite.

Checklist complète : [README racine — Déploiement](../README.md#déploiement-railway-api--vercel-front).

## SMS

```
SMS_MODE=simulate          # défaut — aucun réseau
TWILIO_ACCOUNT_SID=        # placeholders vides uniquement
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

- **simulate** : `send_urgency_sms` enregistre un succès simulé, masque le téléphone dans les logs (`***0001`), n’écrit pas le corps (groupe sanguin).
- **live** : uniquement si `SMS_MODE=live` **et** les trois `TWILIO_*` sont non vides. Le send reste un stub local dans ce MVP (pas d’achat de numéro, pas d’HTTP). Sans identifiants, retour automatique à simulate.
- Réponse `POST /alerts` : `notification.simulated_count`, `channel`, `mode`, `implemented`, `sent` (toujours `false` tant qu’aucun SMS réel n’est accepté).

**Ne jamais logger téléphone, GPS ou groupe sanguin en clair. Ne jamais committer de secrets Twilio.**
