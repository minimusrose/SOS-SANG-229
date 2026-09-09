# Backend — SOS Sang 229

API FastAPI (squelette). Point d’entrée : `app/main.py`.

## Lancer

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Lancer ces commandes depuis le dossier `backend/`.

- Santé : [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Docs OpenAPI : [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Dossiers

```
app/
  main.py          # application FastAPI
  routers/         # routes (health + stubs)
  models/          # modèles ORM — à venir (PostGIS hors scope)
  schemas/         # schémas Pydantic placeholder
```

JWT, Twilio et PostgreSQL/PostGIS ne sont pas implémentés. Les variables correspondantes figurent uniquement dans `.env.example` à la racine.

Ne jamais logger téléphone, GPS ou groupe sanguin en clair.
