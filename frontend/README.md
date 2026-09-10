# Frontend — SOS Sang 229

React (JavaScript) + Tailwind CSS, bundlé avec Vite. Les écrans appellent l’API FastAPI en local/dev.

## Configurer l’API

```bash
cp .env.example .env
```

`.env` (jamais commité) :

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Si la variable est absente, le client utilise le même défaut. CORS côté API : `http://localhost:5173` et `http://127.0.0.1:5173`.

## Lancer avec le backend

1. Postgres + migrations + seed (données fictives) puis :

   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. Frontend :

   ```bash
   npm install
   npm run dev
   ```

App : [http://localhost:5173](http://localhost:5173)

Build : `npm run build`.

## Routes

| Chemin | Écran | API |
| --- | --- | --- |
| `/` | Accueil | — |
| `/donneur/inscription` | Inscription donneur | `POST /donors` |
| `/alerte` | Alerte urgence (select hôpitaux reconnus uniquement) | `GET /hospitals/recognized`, `POST /alerts` |
| `/suivi` | Liste des demandes | `GET /requests` |
| `/suivi/:publicRef` | Détail + confirmation de don | `GET /requests/{public_ref}`, `POST /donations` |

Toasts succès / erreur. Après une alerte, le résumé affiche les SMS **simulés** (aucun envoi réel, aucun numéro). Aucune géolocalisation navigateur. Ne pas saisir de données personnelles réelles.

## Plan de test

Voir le plan dans le [README racine](../README.md#plan-de-test-rapide).
