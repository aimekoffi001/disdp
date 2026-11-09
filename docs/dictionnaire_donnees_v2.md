# Dictionnaire de données DISDP — version 2

**Projet :** Drones de surveillance des champs avec dissuasion sonore des animaux (FabLab UVCI)  
**Stack visée :** Laravel 12, MySQL/MariaDB (XAMPP, phpMyAdmin), Angular, module ESP32  
**Date :** 28/10/2026 — **Statut :** Document de référence / Source de vérité  

---

## 1. Conventions retenues

| Élément | Règle |
| :--- | :--- |
| **Moteur / Jeu de caractères** | InnoDB, utf8mb4 |
| **Noms** | snake_case, sans accent, tables au pluriel, FK nommées `<table_singulier>_id` |
| **Clé primaire** | `id` BIGINT UNSIGNED auto-incrémenté (`$table->id()` dans Laravel) |
| **Statuts / Types / Gravités** | chaîne en snake_case (`en_vol`), valeurs finies contrôlées par un **Enum PHP (backed enum)** |
| **Unités** | mètres, m/s, pourcentage, °C, degrés, hertz |
| **Dates** | fuseau UTC (Côte d'Ivoire UTC+0) |
| **Horodatages Laravel** | `created_at`, `updated_at` ; `deleted_at` pour la suppression logique (SoftDeletes) |
| **ON DELETE** | `RESTRICT` pour l'historique et entités maîtresses ; `CASCADE` pour composants directs ; `SET NULL` pour liens optionnels |

---

## 2. Dictionnaire des 19 tables

### Groupe A — Utilisateurs et équipements

#### 2.1 `users`
Rôle : comptes de connexion au Dashboard.
- `id` : BIGINT UNSIGNED, PK
- `nom` : VARCHAR(100), NOT NULL
- `prenom` : VARCHAR(100), NULL
- `email` : VARCHAR(191), UNIQUE, NOT NULL
- `password` : VARCHAR(255), NOT NULL (haché)
- `role` : VARCHAR(30), NOT NULL, défaut `operateur` — Enum `RoleUser` : `administrateur`, `operateur`, `technicien`, `observateur`
- `actif` : BOOLEAN, NOT NULL, défaut `1`
- `derniere_connexion_at` : DATETIME, NULL
- `remember_token` : VARCHAR(100), NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.2 `drones`
Rôle : parc de drones supervisés.
- `id` : BIGINT UNSIGNED, PK
- `nom` : VARCHAR(100), NOT NULL
- `code_drone` : VARCHAR(50), UNIQUE, NOT NULL (ex. DRN-001)
- `modele` : VARCHAR(100), NULL
- `numero_serie` : VARCHAR(100), UNIQUE, NULL
- `statut` : VARCHAR(30), NOT NULL, défaut `disponible`, INDEX — Enum `StatutDrone` : `disponible`, `en_vol`, `en_maintenance`, `hors_ligne`
- `niveau_batterie` : DECIMAL(5,2), NULL, CHECK (0-100) (cache dernier relevé)
- `portee_max_km` : DECIMAL(6,2), NOT NULL (portée nominale)
- `latitude_actuelle` : DECIMAL(10,7), NULL (cache position)
- `longitude_actuelle` : DECIMAL(10,7), NULL (cache position)
- `derniere_communication_at` : DATETIME, NULL
- `date_mise_en_service` : DATE, NULL
- `deleted_at` : TIMESTAMP, NULL (SoftDeletes)
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.3 `modules_esp32`
Rôle : cartes ESP32 embarquées qui envoient les mesures à l'application.
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NOT NULL, ON DELETE CASCADE
- `nom` : VARCHAR(100), NOT NULL
- `adresse_mac` : VARCHAR(17), UNIQUE, NOT NULL (format `XX:XX:XX:XX:XX:XX`)
- `version_firmware` : VARCHAR(30), NULL
- `statut` : VARCHAR(30), NOT NULL — Enum `StatutModuleEsp32` : `en_ligne`, `hors_ligne`, `erreur`
- `jeton_api_hash` : VARCHAR(255), NULL
- `derniere_communication_at` : DATETIME, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.4 `capteurs`
Rôle : capteurs installés sur un drone.
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NOT NULL, ON DELETE CASCADE
- `module_esp32_id` : BIGINT UNSIGNED, FK `modules_esp32(id)`, NULL, ON DELETE SET NULL
- `nom` : VARCHAR(100), NOT NULL — UNIQUE (`drone_id`, `nom`)
- `type_capteur` : VARCHAR(50), NOT NULL — Enum `TypeCapteur` : `gps`, `temperature`, `humidite`, `pression`, `tension`, `courant`, `autre`
- `unite_mesure` : VARCHAR(20), NULL (°C, %, hPa, V, A...)
- `plage_min` : DECIMAL(12,4), NULL
- `plage_max` : DECIMAL(12,4), NULL (plage_max >= plage_min)
- `statut` : VARCHAR(30), NOT NULL — Enum `StatutCapteur` : `actif`, `defectueux`, `desactive`
- `date_installation` : DATE, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.5 `cameras`
Rôle : caméras embarquées sur les drones.
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NOT NULL, ON DELETE CASCADE
- `nom` : VARCHAR(100), NOT NULL — UNIQUE (`drone_id`, `nom`)
- `type_camera` : VARCHAR(50), NOT NULL — Enum `TypeCamera` : `rgb`, `thermique`, `infrarouge`
- `resolution` : VARCHAR(30), NULL (ex. 1920x1080)
- `statut` : VARCHAR(30), NOT NULL — Enum `StatutCamera` : `active`, `inactive`, `defectueuse`
- `adresse_flux_video` : VARCHAR(500), NULL (chiffré via cast `encrypted`)
- `date_ajout` : DATETIME, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

---

### Groupe B — Terrain et missions

#### 2.6 `zones_surveillance`
Rôle : parcelles agricoles à surveiller.
- `id` : BIGINT UNSIGNED, PK
- `nom_zone` : VARCHAR(150), NOT NULL
- `description` : TEXT, NULL
- `type_culture` : VARCHAR(100), NULL
- `latitude_centre` : DECIMAL(10,7), NOT NULL
- `longitude_centre` : DECIMAL(10,7), NOT NULL
- `surface_hectares` : DECIMAL(10,2), NULL
- `limites_gps` : JSON, NULL (GeoJSON Polygon)
- `responsable_id` : BIGINT UNSIGNED, FK `users(id)`, NULL, ON DELETE SET NULL
- `deleted_at` : TIMESTAMP, NULL (SoftDeletes)
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.7 `missions`
Rôle : plans de vol et opérations de surveillance.
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NOT NULL, ON DELETE RESTRICT
- `zone_id` : BIGINT UNSIGNED, FK `zones_surveillance(id)`, NOT NULL, ON DELETE RESTRICT
- `cree_par_id` : BIGINT UNSIGNED, FK `users(id)`, NULL, ON DELETE SET NULL
- `nom_mission` : VARCHAR(150), NOT NULL
- `type_mission` : VARCHAR(30), NOT NULL — Enum `TypeMission` : `surveillance`, `dissuasion`, `test`
- `description` : TEXT, NULL
- `date_debut_prevue` : DATETIME, NOT NULL, INDEX
- `date_fin_prevue` : DATETIME, NULL
- `date_debut_reelle` : DATETIME, NULL
- `date_fin_reelle` : DATETIME, NULL
- `altitude_prevue` : DECIMAL(7,2), NULL (mètres)
- `vitesse_prevue` : DECIMAL(6,2), NULL (m/s)
- `statut` : VARCHAR(30), NOT NULL, défaut `planifiee`, INDEX (`drone_id`, `statut`) — Enum `StatutMission` : `planifiee`, `en_cours`, `terminee`, `annulee`, `echouee`
- `motif_arret` : TEXT, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.8 `points_vol`
Rôle : waypoints composant le plan de vol d'une mission.
- `id` : BIGINT UNSIGNED, PK
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NOT NULL, ON DELETE CASCADE
- `ordre` : INT UNSIGNED, NOT NULL — UNIQUE (`mission_id`, `ordre`)
- `latitude` : DECIMAL(10,7), NOT NULL
- `longitude` : DECIMAL(10,7), NOT NULL
- `altitude` : DECIMAL(7,2), NULL
- `vitesse_prevue` : DECIMAL(6,2), NULL
- `action` : VARCHAR(30), NOT NULL, défaut `passage` — Enum `ActionPointVol` : `passage`, `survol`, `emission_sonore`, `photo`
- `duree_stationnaire_s` : SMALLINT UNSIGNED, NULL
- `statut` : VARCHAR(30), NOT NULL, défaut `a_atteindre` — Enum `StatutPointVol` : `a_atteindre`, `atteint`, `ignore`
- `atteint_at` : DATETIME, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

---

### Groupe C — Données de vol et mesures

#### 2.9 `telemetries`
Rôle : flux continu de données de vol reçues des drones (haute volumétrie).
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NOT NULL, ON DELETE RESTRICT
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NULL, ON DELETE SET NULL
- `latitude` : DECIMAL(10,7), NULL
- `longitude` : DECIMAL(10,7), NULL
- `altitude` : DECIMAL(7,2), NULL
- `vitesse` : DECIMAL(6,2), NULL
- `niveau_batterie` : DECIMAL(5,2), NULL, CHECK (0-100)
- `tension_batterie_v` : DECIMAL(5,2), NULL
- `temperature` : DECIMAL(5,2), NULL
- `cap_de_vol` : DECIMAL(6,2), NULL, CHECK (0-360)
- `nb_satellites` : TINYINT UNSIGNED, NULL
- `force_signal_dbm` : SMALLINT, NULL
- `date_mesure` : DATETIME(3), NOT NULL
- `created_at` : TIMESTAMP, NULL
- **Règle :** PAS de `updated_at` (mesure immuable).
- **Index :** (`drone_id`, `date_mesure`) et (`mission_id`, `date_mesure`).

#### 2.10 `mesures_capteurs`
Rôle : relevés spécifiques des capteurs physiques (température, humidité, pression...).
- `id` : BIGINT UNSIGNED, PK
- `capteur_id` : BIGINT UNSIGNED, FK `capteurs(id)`, NOT NULL, ON DELETE CASCADE
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NULL, ON DELETE SET NULL
- `valeur` : DOUBLE, NOT NULL
- `qualite_mesure` : VARCHAR(30), NULL — Enum `QualiteMesure` : `valide`, `douteuse`, `invalide`
- `date_mesure` : DATETIME(3), NOT NULL
- **Règle :** PAS de `updated_at`.
- **Index :** (`capteur_id`, `date_mesure`).

#### 2.11 `sessions_video`
Rôle : flux vidéos et enregistrements des caméras durant une mission.
- `id` : BIGINT UNSIGNED, PK
- `camera_id` : BIGINT UNSIGNED, FK `cameras(id)`, NOT NULL, ON DELETE CASCADE
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NULL, ON DELETE SET NULL
- `date_debut` : DATETIME, NOT NULL
- `date_fin` : DATETIME, NULL
- `type_session` : VARCHAR(30), NOT NULL — Enum `TypeSessionVideo` : `direct`, `enregistrement`
- `url_enregistrement` : VARCHAR(500), NULL
- `statut` : VARCHAR(30), NOT NULL — Enum `StatutSessionVideo` : `active`, `terminee`, `interrompue`
- `created_at`, `updated_at` : TIMESTAMP, NULL

---

### Groupe D — Dissuasion des animaux

#### 2.12 `especes_animales`
Rôle : référentiel des espèces d'animaux ciblées par la surveillance et la dissuasion.
- `id` : BIGINT UNSIGNED, PK
- `nom_commun` : VARCHAR(100), UNIQUE, NOT NULL
- `nom_scientifique` : VARCHAR(150), NULL
- `categorie` : VARCHAR(30), NOT NULL — Enum `CategorieEspece` : `oiseau`, `rongeur`, `mammifere`, `primate`, `autre`
- `niveau_nuisance` : VARCHAR(20), NOT NULL — Enum `NiveauNuisance` : `faible`, `moyen`, `eleve`
- `description` : TEXT, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.13 `sons`
Rôle : catalogue des sons répulsifs diffusables par le haut-parleur du drone.
- `id` : BIGINT UNSIGNED, PK
- `nom` : VARCHAR(100), NOT NULL
- `categorie` : VARCHAR(50), NOT NULL — Enum `CategorieSon` : `cri_predateur`, `ultrason`, `bruit_fort`, `sirene`, `autre`
- `chemin_fichier` : VARCHAR(255), NOT NULL
- `format_audio` : VARCHAR(10), NOT NULL (wav, mp3)
- `duree_secondes` : DECIMAL(6,2), NULL
- `frequence_min_hz` : INT UNSIGNED, NULL
- `frequence_max_hz` : INT UNSIGNED, NULL
- `volume_recommande_pct` : TINYINT UNSIGNED, NULL, CHECK (0-100)
- `actif` : BOOLEAN, NOT NULL, défaut `1`
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.14 `son_espece` (table pivot)
Rôle : association N-N entre sons et espèces animales répulsées.
- `son_id` : BIGINT UNSIGNED, FK `sons(id)`, NOT NULL, ON DELETE CASCADE
- `espece_id` : BIGINT UNSIGNED, FK `especes_animales(id)`, NOT NULL, ON DELETE CASCADE
- **Clé primaire :** composée (`son_id`, `espece_id`)

#### 2.15 `detections`
Rôle : détections d'animaux observées pendant les missions de vol.
- `id` : BIGINT UNSIGNED, PK
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NOT NULL, ON DELETE RESTRICT
- `camera_id` : BIGINT UNSIGNED, FK `cameras(id)`, NULL, ON DELETE SET NULL
- `espece_id` : BIGINT UNSIGNED, FK `especes_animales(id)`, NULL, ON DELETE SET NULL
- `source` : VARCHAR(30), NOT NULL — Enum `SourceDetection` : `camera`, `capteur`, `manuelle`
- `nombre_estime` : SMALLINT UNSIGNED, NULL
- `confiance` : DECIMAL(5,2), NULL, CHECK (0-100)
- `latitude` : DECIMAL(10,7), NULL
- `longitude` : DECIMAL(10,7), NULL
- `image_path` : VARCHAR(500), NULL
- `statut` : VARCHAR(30), NOT NULL, défaut `nouvelle` — Enum `StatutDetection` : `nouvelle`, `confirmee`, `fausse_alerte`
- `valide_par_id` : BIGINT UNSIGNED, FK `users(id)`, NULL, ON DELETE SET NULL
- `date_detection` : DATETIME(3), NOT NULL, INDEX
- `created_at` : TIMESTAMP, NULL (pas de `updated_at`)

#### 2.16 `emissions_sonores`
Rôle : historique de chaque diffusion sonore effectuée par un drone.
- `id` : BIGINT UNSIGNED, PK
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NOT NULL, ON DELETE RESTRICT
- `son_id` : BIGINT UNSIGNED, FK `sons(id)`, NOT NULL, ON DELETE RESTRICT
- `detection_id` : BIGINT UNSIGNED, FK `detections(id)`, NULL, ON DELETE SET NULL
- `commande_par_id` : BIGINT UNSIGNED, FK `users(id)`, NULL, ON DELETE SET NULL
- `declenchement` : VARCHAR(20), NOT NULL — Enum `DeclenchementEmission` : `automatique`, `manuel`, `programme`
- `volume_pct` : TINYINT UNSIGNED, NOT NULL, CHECK (0-100)
- `date_debut` : DATETIME(3), NOT NULL, INDEX
- `duree_secondes` : DECIMAL(6,2), NULL
- `latitude` : DECIMAL(10,7), NULL
- `longitude` : DECIMAL(10,7), NULL
- `resultat` : VARCHAR(30), NULL — Enum `ResultatEmission` : `animaux_partis`, `sans_effet`, `indetermine`
- `created_at` : TIMESTAMP, NULL (pas de `updated_at`)

---

### Groupe E — Supervision et maintenance

#### 2.17 `alertes`
Rôle : alertes et notifications générées par le système.
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NULL, ON DELETE SET NULL
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NULL, ON DELETE SET NULL
- `detection_id` : BIGINT UNSIGNED, FK `detections(id)`, NULL, ON DELETE SET NULL
- `type_alerte` : VARCHAR(40), NOT NULL — Enum `TypeAlerte` : `batterie_faible`, `perte_signal`, `hors_zone`, `detection_animal`, `panne_capteur`, `temperature_elevee`
- `gravite` : VARCHAR(20), NOT NULL — Enum `GraviteAlerte` : `info`, `avertissement`, `critique`
- `message` : VARCHAR(255), NOT NULL
- `valeur_mesuree` : DECIMAL(12,4), NULL
- `seuil` : DECIMAL(12,4), NULL
- `statut` : VARCHAR(20), NOT NULL, défaut `nouvelle`, INDEX — Enum `StatutAlerte` : `nouvelle`, `acquittee`, `resolue`
- `acquittee_par_id` : BIGINT UNSIGNED, FK `users(id)`, NULL, ON DELETE SET NULL
- `acquittee_at` : DATETIME, NULL
- `created_at` : TIMESTAMP, NULL (pas de `updated_at`)

#### 2.18 `incidents`
Rôle : signalement des pannes et anomalies matérielles ou logicielles.
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NOT NULL, ON DELETE RESTRICT
- `mission_id` : BIGINT UNSIGNED, FK `missions(id)`, NULL, ON DELETE SET NULL
- `composant` : VARCHAR(50), NOT NULL — Enum `ComposantIncident` : `moteur`, `batterie`, `helice`, `capteur`, `camera`, `module_esp32`, `haut_parleur`, `autre`
- `titre` : VARCHAR(150), NOT NULL
- `description` : TEXT, NULL
- `gravite` : VARCHAR(20), NOT NULL — Enum `GraviteIncident` : `mineure`, `majeure`, `critique`
- `statut` : VARCHAR(20), NOT NULL, défaut `ouvert` — Enum `StatutIncident` : `ouvert`, `en_analyse`, `resolu`, `clos`
- `cause` : TEXT, NULL
- `solution` : TEXT, NULL
- `signale_par_id` : BIGINT UNSIGNED, FK `users(id)`, NULL, ON DELETE SET NULL
- `date_incident` : DATETIME, NOT NULL
- `date_resolution` : DATETIME, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

#### 2.19 `inspections`
Rôle : visites techniques et contrôles périodiques des drones.
- `id` : BIGINT UNSIGNED, PK
- `drone_id` : BIGINT UNSIGNED, FK `drones(id)`, NOT NULL, ON DELETE RESTRICT
- `technicien_id` : BIGINT UNSIGNED, FK `users(id)`, NOT NULL, ON DELETE RESTRICT
- `type_inspection` : VARCHAR(30), NOT NULL — Enum `TypeInspection` : `controle_initial`, `preventive`, `corrective`
- `date_inspection` : DATETIME, NOT NULL
- `resultat` : VARCHAR(20), NOT NULL — Enum `ResultatInspection` : `conforme`, `reserves`, `non_conforme`
- `observations` : TEXT, NULL
- `prochaine_inspection` : DATE, NULL
- `created_at`, `updated_at` : TIMESTAMP, NULL

---

## 3. Synthèse des règles ON DELETE

| Table cible (FK) | Référence | ON DELETE | Justification métier |
| :--- | :--- | :--- | :--- |
| `modules_esp32` | `drones(id)` | **CASCADE** | L'ESP32 est un composant physique solidaire du drone |
| `capteurs` | `drones(id)` | **CASCADE** | Le capteur physique appartient au drone |
| `capteurs` | `modules_esp32(id)` | **SET NULL** | Si la carte ESP32 change, le capteur reste sur le drone |
| `cameras` | `drones(id)` | **CASCADE** | La caméra est solidaire du drone |
| `zones_surveillance` | `users(id)` | **SET NULL** | Si le responsable quitte le projet, la zone subsiste |
| `missions` | `drones(id)` | **RESTRICT** | Interdit d'effacer un drone ayant un historique de missions |
| `missions` | `zones_surveillance(id)` | **RESTRICT** | Conserve l'intégrité de la zone surveillée |
| `missions` | `users(id)` | **SET NULL** | Si le créateur est supprimé, la mission reste documentée |
| `points_vol` | `missions(id)` | **CASCADE** | Les waypoints dépendent strictement de la mission |
| `telemetries` | `drones(id)` | **RESTRICT** | Données de vol critiques et inaltérables |
| `telemetries` | `missions(id)` | **SET NULL** | Vol hors mission ou purge de la mission |
| `mesures_capteurs` | `capteurs(id)` | **CASCADE** | Mesures attachées au cycle de vie du capteur |
| `mesures_capteurs` | `missions(id)` | **SET NULL** | Mesure d'ambiance hors mission conservée |
| `sessions_video` | `cameras(id)` | **CASCADE** | Vidéos liées à la caméra |
| `sessions_video` | `missions(id)` | **SET NULL** | Session vidéo conservée si mission archivée |
| `son_espece` | `sons(id)` / `especes(id)` | **CASCADE** | Lignes de pivot supprimées avec l'entité liée |
| `detections` | `missions(id)` | **RESTRICT** | Preuve légale / historique d'intrusion animalière |
| `detections` | `cameras(id)` / `especes(id)` / `users(id)` | **SET NULL** | Informations contextuelles optionnelles |
| `emissions_sonores` | `missions(id)` / `sons(id)` | **RESTRICT** | Traçabilité des diffusions sonores |
| `emissions_sonores` | `detections(id)` / `users(id)` | **SET NULL** | Déclenchement automatique sans opérateur |
| `alertes` | `drones` / `missions` / `detections` / `users` | **SET NULL** | L'alerte est un journal d'événements persistant |
| `incidents` | `drones(id)` | **RESTRICT** | Historique de maintenance obligatoire |
| `incidents` | `missions(id)` / `users(id)` | **SET NULL** | Incident hors mission ou utilisateur supprimé |
| `inspections` | `drones(id)` / `users(id)` | **RESTRICT** | Registre légal de sécurité aéronautique |

