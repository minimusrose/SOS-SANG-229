# Plan d'action — Refonte UI/UX & motion · SOS Sang 229

Audit réalisé le 10 septembre 2026 sur `127.0.0.1:5173`, en desktop 1440 px et mobile 375 px, sur les quatre écrans (Accueil, Inscription donneur, Alerte urgence, Suivi des demandes).

L'API FastAPI ne répondait pas pendant le passage : les remarques sur les états chargés portent sur leur absence, pas sur leur qualité.

**Effort total estimé : ~13 h.** Les lots sont ordonnés par rapport résultat visible / heure investie. Les lots 1 à 3 suffisent déjà à transformer la perception du produit.

---

## Sommaire

| Lot | Objet | Effort |
|-----|-------|--------|
| 1 | Contrastes | ~30 min |
| 2 | États de chargement et de succès | ~2 h |
| 3 | Apparition au scroll | ~1 h |
| 4 | Micro-interactions | ~2 h |
| 5 | Transitions de page | ~1 h |
| 6 | Hero et signature visuelle | ~1 h 30 |
| 7 | Icônes et états vides | ~2 h |
| 8 | Vernis | ~3 h |
| — | Règles transverses | — |

---

## LOT 1 — Contrastes

*À faire en premier. Aucune animation ne rattrape un texte illisible.*

1. Remplace le gris de texte `#8D99AE` par `#5C6478` partout où il porte du texte : sous-titre du hero, descriptions de cartes, libellés de stats, textes d'aide sous les champs. *(2,88:1 → 5,92:1)*
2. Conserve `#EF233C` pour les aplats, fonds et bordures, mais crée une variante texte `#B81B33` et utilise-la pour tout texte rouge de moins de 20 px : « Ouvrir → », surtitres, lien de nav actif, libellés « (requis) ». *(4,22:1 → 5,84:1)*
3. Vérifie que le blanc sur le bouton rouge reste lisible : assombris le fond du bouton primaire à `#C81D32` ou passe le libellé en 17 px semi-gras.
4. Passe l'interligne du titre du hero de 1,0 à 1,14.

---

## LOT 2 — États de chargement et de succès

*Le plus gros gain d'usage de toute la liste.*

5. Sur les trois boutons de soumission (Inscription, Alerte, recherche de référence) : au clic, verrouille le bouton, remplace son libellé par « Envoi en cours… » et affiche un indicateur rotatif à gauche du texte. Empêche tout second envoi tant que la requête tourne.
6. À la réponse réussie, fais passer le bouton en vert avec une coche qui se dessine en 420 ms, puis reviens à l'état initial après 2,4 s.
7. Crée un écran de confirmation d'alerte orchestré : une coche entourée qui apparaît en rebond, puis la référence publique 560 ms après, puis la liste des donneurs compatibles qui arrivent un par un à 110 ms d'intervalle. **Cet écran est le cœur émotionnel du produit, ne le réduis pas à un toast.**
8. Remplace le chargement de la liste du Suivi et de la liste des hôpitaux par des squelettes : des blocs gris de la forme exacte du contenu à venir, parcourus par un balayage clair de 1,35 s. Le passage au contenu réel ne doit provoquer aucun saut de mise en page.
9. Refais le toast : entrée par glissement depuis le bas en 380 ms, maintien 3,2 s, disparition automatique, et **effacement obligatoire à chaque changement de route**. Positionne-le au-dessus de la barre d'onglets mobile, jamais par-dessus les champs.
10. Remplace le message « Lancez uvicorn (127.0.0.1:8000) » par un message utilisateur : « Service indisponible. Réessayez dans un instant. » Ajoute un bouton « Réessayer » à côté.
11. Sur l'écran Alerte, quand la liste des hôpitaux ne charge pas, n'affiche pas l'erreur comme unique option du menu déroulant : garde le champ actif et propose un bouton « Recharger la liste » sous le champ.

---

## LOT 3 — Apparition au scroll

*Meilleur rapport impact / effort de toute la refonte.*

12. Définis trois durées de référence et n'en utilise aucune autre : **150 ms** pour les micro-interactions, **300 ms** pour les apparitions, **600 ms** pour les changements de page.
13. Définis deux courbes : une **sortie douce** pour tout ce qui apparaît ou se déplace, et une courbe **légèrement rebondissante** réservée exclusivement aux confirmations de succès.
14. Fixe l'amplitude d'apparition à **20 px** de montée, jamais plus.
15. Applique un comportement d'apparition unique à toutes les sections : montée de 20 px et fondu de 0 à 1, déclenchés à l'entrée dans le champ de vision, une seule fois.
16. Dans chaque grille (les trois étapes, les trois cartes de parcours, les cartes du Suivi), décale l'apparition de chaque élément de **80 ms** sur le précédent.
17. Fais respecter le réglage système « réduire les animations » : quand il est actif, supprime tous les mouvements décoratifs et affiche immédiatement l'état final, mais **conserve les changements d'état visibles** (chargement, succès, statut).

---

## LOT 4 — Micro-interactions

18. Ajoute à tous les boutons : montée de 2 px et ombre renforcée au survol, compression à 0,96 au clic.
19. Ajoute un reflet clair qui balaie le bouton toutes les 3,6 s, **uniquement sur le bouton primaire de chaque écran**. Aucun autre bouton.
20. Redessine les champs : libellé placé dans le champ qui se réduit et remonte au focus, bordure qui passe à la couleur d'accent avec un halo de 4 px, coche verte qui apparaît en rebond dès que la valeur est reconnue comme valide.
21. Ajoute un contour de focus clavier visible et cohérent sur tous les éléments interactifs.
22. Sur les puces de filtre du Suivi : au lieu de repeindre chaque puce, fais glisser une pastille rouge unique d'une position à l'autre en 300 ms, et porte l'état par un attribut d'état, **pas seulement par la couleur**.
23. Sur la barre de navigation et la barre d'onglets mobile : remplace le changement de couleur par un trait de 2,5 px qui glisse d'une entrée à l'autre en 300 ms.
24. Rends l'en-tête compactable : au-delà de 24 px de défilement, réduis la hauteur, masque le sous-titre « Démo locale · Hackathon Cursor Bénin », réduis la pastille de marque et ajoute un flou d'arrière-plan. Transition de 300 ms.
25. **Supprime la double navigation mobile** : garde la barre d'onglets fixe en bas, supprime le bouton « Menu » et son panneau, qui mènent aux quatre mêmes destinations.
26. Agrandis les zones cliquables à **44 px de haut minimum** : entrées de navigation, bouton de fermeture du toast, case à cocher de consentement.

---

## LOT 5 — Transitions de page

27. Ajoute une transition de route : la page sortante s'efface en remontant de 10 px en 260 ms, l'entrante arrive du bas en 380 ms avec 140 ms de retard.
28. Ajoute une barre de progression fine en haut de l'écran pendant le changement de route, résorbée en 640 ms.
29. À chaque changement de route, remonte la page en haut et **déplace le focus clavier sur le titre principal**.
30. Donne à chaque route son propre titre de document au lieu de « SOS Sang 229 » partout.
31. Crée une vraie page 404 avec la même identité visuelle, un message clair et un bouton de retour à l'accueil. *Une URL inconnue affiche actuellement une page strictement vide.*
32. Fais figurer le filtre actif du Suivi dans l'URL, pour qu'un état filtré soit partageable et que le retour arrière le défasse.

---

## LOT 6 — Hero et signature visuelle

33. Remplace le dégradé plat du hero par trois masses de couleur floutées (28 px de flou) en rouges et rosés désaturés, qui dérivent lentement sur des cycles de 14 à 22 s en alternance. **N'anime que des transformations**, jamais des positions.
34. Superpose une trame de points de 14 px de maille, estompée vers le bas par un masque dégradé.
35. Fais entrer le titre du hero mot par mot : chaque mot arrive avec un flou de 9 px qui se dissipe en 620 ms, décalé de 80 ms sur le précédent. Le mot « vie » entre **en dernier**, avec un léger effet d'accent.
36. Anime la pastille du badge « Urgence transfusionnelle » en battement cardiaque : deux impulsions rapprochées puis une pause, cycle de 1,5 s. Réutilise **exactement ce même battement** sur le statut « En matching » et sur la barre de navigation quand une alerte est active. C'est le seul motif décoratif autorisé à traverser tout le produit.
37. Anime les compteurs de statistiques de 0 à leur valeur en 900 ms, avec des chiffres à chasse fixe pour éviter le tremblement.
38. **Supprime la statistique « Donnée réelle stockée : 0 »** et remplace-la par des métriques qui rassurent : donneurs joignables, groupes couverts, délai médian de réponse.
39. Ajoute sous le hero une invitation à faire défiler : une ligne verticale de 34 px dans laquelle une lueur retombe en boucle toutes les 1,8 s.

---

## LOT 7 — Icônes et états vides

40. Crée un jeu minimal d'icônes en trait : goutte, hôpital, téléphone, localisation, signal. Anime leur tracé en 900 ms à l'apparition, avec 140 ms de décalage entre chacune. *(Il n'y a aujourd'hui aucune icône dans l'application, ce qui bloque tout un registre d'animations.)*
41. Ajoute un état vide illustré partout où une liste peut être vide : un pictogramme qui se dessine, une phrase d'explication, un bouton d'action.
42. Définis trois niveaux d'ombre au lieu d'un seul : **posé** pour l'information, **détaché** pour l'action, et un troisième niveau réservé aux blocs d'alerte — le seul autorisé à porter la couleur d'accent.
43. Fais porter les statuts par la forme autant que par la couleur : point pulsant pour « En matching », coche qui se dessine pour « Pourvue », bande verticale colorée à gauche de chaque ligne. **Les daltoniens doivent pouvoir les distinguer.**

---

## LOT 8 — Vernis

*Seulement si tout le reste tient.*

44. Transforme la section « Comment ça marchera » en parcours ancré : le titre reste fixe pendant que les trois étapes défilent, avec une ligne verticale qui se remplit proportionnellement au défilement et des points qui s'allument au passage.
45. Passe la section « Explorer le parcours » en grille asymétrique : la carte « Signaler une urgence » occupe le double de surface des deux autres.
46. Ajoute au survol des cartes : montée de 3 px, ombre amplifiée, flèche « Ouvrir → » qui glisse de 5 px vers la droite, et un halo qui suit le curseur à l'intérieur de la carte.
47. Ajoute sous le hero un bandeau défilant des groupes sanguins sur 18 s en boucle linéaire, avec fondu aux deux extrémités, où les groupes actuellement recherchés apparaissent en rouge plein.
48. Ajoute une illustration au hero : une carte stylisée avec des points de donneurs qui s'allument par vagues autour d'un hôpital, onde de 3 s. C'est le **seul** endroit du produit où une animation ambiante permanente est justifiée.

---

## Règles transverses

*À tenir sur toute la refonte.*

49. **Sépare deux registres.** Sur l'accueil, le mouvement peut être généreux : c'est la vitrine. Sur Alerte, Inscription et Suivi, le mouvement ne sert qu'à *informer* — chargement, succès, changement de statut, validation de champ. Aucun fond animé, aucune boucle décorative derrière un formulaire rempli en urgence par une infirmière.
50. **Avant d'ajouter une animation**, formule la phrase « ça permet à l'utilisateur de comprendre que… ». Si tu n'y arrives pas, supprime-la.
51. **Ne dépasse jamais** les trois durées et les deux courbes définies aux points 12 et 13.
52. Sur l'écran Alerte, **fusionne les trois blocs d'avertissement empilés** avant le premier champ en un seul. Répété trois fois, le message de prudence n'est plus lu.

---

## Rappel des tokens de mouvement

| Token | Valeur | Usage |
|-------|--------|-------|
| durée micro | 150 ms | survol, clic, focus, validation de champ |
| durée entrée | 300 ms | apparitions, glissements d'état |
| durée page | 600 ms | changement de route |
| courbe sortie douce | `cubic-bezier(.22, 1, .36, 1)` | tout ce qui apparaît ou se déplace |
| courbe rebond | `cubic-bezier(.34, 1.56, .64, 1)` | confirmations de succès **uniquement** |
| amplitude | 20 px | montée à l'apparition |
| décalage en grille | 80 ms | entre deux éléments successifs |
| battement cardiaque | 1,5 s · 2 impulsions | signature du produit |

## Rappel des couleurs corrigées

| Rôle | Avant | Après | Contraste sur blanc |
|------|-------|-------|---------------------|
| Texte secondaire | `#8D99AE` | `#5C6478` | 2,88:1 → 5,92:1 |
| Texte d'accent | `#EF233C` | `#B81B33` | 4,22:1 → 5,84:1 |
| Aplats et fonds | `#EF233C` | inchangé | — |
| Fond bouton primaire | `#EF233C` | `#C81D32` | blanc lisible |
