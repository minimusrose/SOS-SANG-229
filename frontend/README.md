# Frontend — SOS Sang 229

React (JavaScript) + Tailwind CSS, bundlé avec Vite.

## Lancer

```bash
npm install
npm run dev
```

App : [http://localhost:5173](http://localhost:5173)

## Routes (maquette statique)

| Chemin | Écran |
| --- | --- |
| `/` | Accueil — intention produit et accès aux 3 parcours |
| `/donneur/inscription` | Inscription donneur (groupe, téléphone fictif, ville, consentement GPS) |
| `/alerte` | Alerte urgence (groupe, patient démo, hôpital reconnu — select uniquement) |
| `/suivi` | Suivi — lignes REQ-DEMO-* et état vide |

Les soumissions affichent un toast local. Aucun appel API, aucun stockage persistant. Ne pas saisir de données personnelles réelles.
