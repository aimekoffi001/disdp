# DISPD — Supervision Intelligente de Drones

Dashboard Angular 21 (standalone, signaux, Tailwind CSS 4, Leaflet, Lucide). **Mode démonstration** : données et télémétrie simulées.

## Lancer
```bash
npm install --legacy-peer-deps
npx ng serve        # http://localhost:4200
npx ng build        # production -> dist/dispd/browser
```
(`--legacy-peer-deps` contourne un bug d'arborescence npm rencontré avec cette version d'Angular.)

## Vidéo de la caméra
Déposez une vidéo libre de droits (ex. drone sur champ, Pexels/Pixabay) dans `public/media/demo-drone.mp4`.
Sinon une vidéo CC0 distante (MDN) est essayée, puis l'état « Flux indisponible » s'affiche.
Sources et flux réel : `src/app/core/config/app-settings.ts`.

## Structure
`core/` (modèles, services, données de démo, config) · `shared/` (composants réutilisables) · `layout/` (sidebar, topbar, formulaires) · `features/` (dashboard + pages).

## Connexion simulée
Comptes de démo : `admin@dispd.demo` (Administrateur) ou `operateur@dispd.demo` (Opérateur), mot de passe `demo1234`.
Cliquer sur l'avatar en haut à droite affiche les informations du compte et permet de se déconnecter.

## Fonctionnalités de vol (simulées)
- En-tête du dashboard : statut du drone sélectionné, bouton Démarrer / Arrêter, choix du mode de vol.
- Planification : drone, mission (choisie parmi les missions disponibles), date de départ, plan de modes (ex. manuel → semi-automatique après X min → automatique après Y min) et périmètres tracés sur la carte (position GPS du drone en direct).
- Les vols programmés sont exécutés par la simulation à l'heure de départ. Paramètres > « Accélération » (×10, ×60) permet de tester un plan de vol en quelques secondes.
- Zones : déplacement de chaque drone en temps réel, drone situé dans quelle zone, périmètres planifiés.

## Réalisé / simulé
- Réel (local) : navigation, CRUD drones et missions, programmation de vols (validée), alertes (traitement + compteur), recherche, filtres, notifications, persistance localStorage, carte Leaflet interactive, export CSV.
- Simulé : télémétrie (position, batterie, moteurs, capteurs), flux vidéo, coordonnées GPS, tendances des statistiques (référence « veille »).
- Non développé : rapports PDF, édition des zones, authentification, tests unitaires.
- Aucun ordre de vol n'est envoyé à un drone.
