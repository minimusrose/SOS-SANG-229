# Backend — SOS Sang 229

API FastAPI. Point d’entrée : `app/main.py`.

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

## Postgres + PostGIS et migrations

La base locale est le service `db` de `docker-compose.yml` (`postgis/postgis:16-3.4`).
L’extension PostGIS est activée par la première migration Alembic.

1. À la racine du dépôt, copier `.env.example` vers `.env` (jamais commité).
2. Définir un mot de passe local dans `.env`, par exemple :

   ```
   POSTGRES_PASSWORD=changeme_local_only
   DATABASE_URL=postgresql://sos_sang:changeme_local_only@127.0.0.1:5432/sos_sang_229
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

## Schéma MVP

| Table | Rôle produit | Champs sensibles |
| --- | --- | --- |
| `donors` | User / Donneur | `phone`, `blood_group`, `location` (GPS PostGIS) |
| `hospitals` | Établissement | `contact_phone`, `location` |
| `urgency_requests` | Urgence / alerte (`hospital_id` FK uniquement) | `blood_group_needed`, `patient_display_name` (démo uniquement) |
| `donation_confirmations` | Confirmation de don | lie donneur + urgence (`confirmed_at`, `status`) |

- Localisation optionnelle : `geography(POINT, 4326)` (WGS84). Pas de requêtes de matching dans ce lot.
- Compteurs sur une urgence : `alerted_donors_count`, `confirmed_donations_count`.
- Identifiants code en anglais ; libellés produit FR ok dans les docs.

### Hôpitaux reconnus

Une urgence ne peut cibler **que** un établissement avec `hospitals.is_recognized = true` (reconnus par l’État — liste démo pour le MVP).

- Défaut colonne : **`false`** (non reconnu tant qu’on ne le marque pas).
- Pas de nom d’hôpital en texte libre sur `urgency_requests` : uniquement `hospital_id` (FK).
- Le seed marque `Hopital Demo` comme reconnu et ajoute `Clinique Demo Non Reconnue` (`is_recognized = false`) pour le contraste.
- L’API (lot suivant) **doit refuser** toute urgence si `hospital.is_recognized` est faux. Helper : `app.rules.require_recognized_hospital`. Un trigger Postgres (`trg_urgency_recognized_hospital`) applique la même règle à l’insert/update.

Les schémas Pydantic create/read sont dans `app/schemas/`. Pas de CRUD HTTP complet ici.

Tests unitaires (sans base) :

```bash
python -m unittest tests.test_schema
```

## Dossiers

```
app/
  main.py           # application FastAPI
  config.py         # DATABASE_URL depuis l’environnement
  db.py             # engine / session (lazy)
  enums.py          # BloodGroup, statuts
  routers/          # health + stubs
  models/           # ORM SQLAlchemy + PostGIS
  schemas/          # Pydantic create/read
alembic/            # migrations
scripts/seed_demo.py
```

JWT et Twilio ne sont pas implémentés. Les variables correspondantes figurent uniquement dans `.env.example`.

**Ne jamais logger téléphone, GPS ou groupe sanguin en clair.**
