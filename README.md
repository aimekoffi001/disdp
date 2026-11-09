# DISPD — Supervision Intelligente de Drones (FABLAB_DRONE)

Plateforme complète de supervision, télémétrie et gestion opérationnelle d'une flotte de drones et répulsifs acoustiques.

---

## 📁 Architecture du Projet

```text
C:\projets\disdp\
├── backend\                  ← Application Laravel (API, logique métier, base de données, websockets)
├── frontend\                 ← Application Angular (Cockpit de supervision cartographique & alertes)
├── docker\                   ← Fichiers de configuration des conteneurs
│   ├── frontend\             ← Dockerfile & Nginx pour l'application Angular
│   ├── nginx\                ← Configuration Nginx pour Laravel
│   └── php\                  ← Dockerfile PHP-FPM 8.3
├── docker-compose.yml        ← Orchestrateur Docker complet (Frontend, Backend, Nginx, MySQL, phpMyAdmin)
├── tools\                    ← Scripts d'analyse et d'extraction (DanaiLab, styles, etc.)
├── docs\                     ← Documentation technique (Dictionnaire de données v2, Schéma DBML)
├── .dockerignore             ← Fichiers exclus des contextes de build Docker
├── .gitignore                ← Règles Git pour le projet global
└── README.md                 ← Guide de démarrage et documentation générale
```

---

## 🚀 Démarrage et Déploiement avec Docker

### 1. Démarrer toute la stack de conteneurs

À la racine du projet (`C:\projets\disdp`) :

```bash
docker compose up -d --build
```

### 2. Initialiser le Backend Laravel (première fois)

Installez les dépendances Composer et exécutez les migrations dans le conteneur `app` :

```bash
# Installer les dépendances PHP
docker compose exec app composer install

# Générer la clé d'application si nécessaire
docker compose exec app php artisan key:generate

# Exécuter les migrations et charger les données de test
docker compose exec app php artisan migrate --seed
```

---

## 🌐 Services & Ports d'accès

| Service | Rôle | URL / Port |
| :--- | :--- | :--- |
| **Frontend (Cockpit)** | Application Angular de supervision | [http://localhost:4200](http://localhost:4200) |
| **Backend API** | API Laravel & routes de télémétrie | [http://localhost:8000](http://localhost:8000) |
| **phpMyAdmin** | Gestion visuelle de MySQL | [http://localhost:8080](http://localhost:8080) |
| **Base de données MySQL** | Port externe pour DBeaver / Datagrip | `localhost:3307` (user: `disdp`, mdp: `disdp_pass`) |

---

## 🔧 Commandes Utiles Docker

- **Voir l'état des conteneurs** : `docker compose ps`
- **Voir les logs en direct** : `docker compose logs -f`
- **Entrer dans le conteneur PHP** : `docker compose exec app bash`
- **Arrêter les conteneurs** : `docker compose down`
- **Arrêter et réinitialiser les volumes de données** : `docker compose down -v`
