<?php

namespace Database\Seeders;

use App\Models\Camera;
use App\Models\Capteur;
use App\Models\Detection;
use App\Models\Drone;
use App\Models\Historique;
use App\Models\Incident;
use App\Models\Inspection;
use App\Models\Mission;
use App\Models\PlanificationVol;
use App\Models\Son;
use App\Models\Utilisateur;
use App\Models\Video;
use App\Models\ZoneStatique;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with the 13 DISDP core entities.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
        ]);

        // -------------------------------------------------------------
        // 1. UTILISATEURS (Table 1/13)
        // -------------------------------------------------------------
        $admin = Utilisateur::where('email', 'admin@fablab.ci')->first();

        $pilote = Utilisateur::updateOrCreate(
            ['email' => 'pilote.kone@fablab.ci'],
            [
                'nom' => 'Koné',
                'prenom' => 'Ibrahim',
                'password' => Hash::make('password123'),
                'role' => 'pilote',
                'telephone' => '+225 05 04 03 02 01',
                'actif' => true,
                'derniere_connexion_at' => now()->subHours(2),
            ]
        );

        $tech = Utilisateur::updateOrCreate(
            ['email' => 'technicienne.toure@fablab.ci'],
            [
                'nom' => 'Touré',
                'prenom' => 'Awa',
                'password' => Hash::make('password123'),
                'role' => 'technicien',
                'telephone' => '+225 01 02 03 04 05',
                'actif' => true,
                'derniere_connexion_at' => now()->subDays(1),
            ]
        );

        // -------------------------------------------------------------
        // 2. DRONES (Table 2/13)
        // -------------------------------------------------------------
        $drone1 = Drone::updateOrCreate(
            ['code_drone' => 'DRN-001'],
            [
                'nom' => 'Faucon UVCI 1',
                'modele' => 'Hexacopter Agro-Surveillance V2',
                'numero_serie' => 'SN-UVCI-2026-001',
                'statut' => 'disponible',
                'niveau_batterie' => 96.50,
                'portee_max_km' => 15.00,
                'latitude_actuelle' => 5.3551000,
                'longitude_actuelle' => -3.8942000,
                'altitude_actuelle' => 0.00,
                'vitesse_actuelle' => 0.00,
                'date_mise_en_service' => '2026-01-15',
                'derniere_communication_at' => now(),
            ]
        );

        $drone2 = Drone::updateOrCreate(
            ['code_drone' => 'DRN-002'],
            [
                'nom' => 'Aigle UVCI 2',
                'modele' => 'Octocopter Détection Pannes & Thermographie',
                'numero_serie' => 'SN-UVCI-2026-002',
                'statut' => 'en_vol',
                'niveau_batterie' => 82.00,
                'portee_max_km' => 18.00,
                'latitude_actuelle' => 5.3582000,
                'longitude_actuelle' => -3.8914000,
                'altitude_actuelle' => 45.00,
                'vitesse_actuelle' => 8.50,
                'date_mise_en_service' => '2026-02-01',
                'derniere_communication_at' => now(),
            ]
        );

        $drone3 = Drone::updateOrCreate(
            ['code_drone' => 'DRN-003'],
            [
                'nom' => 'Milan UVCI 3',
                'modele' => 'Quadricopter Reconnaissance & Acoustique',
                'numero_serie' => 'SN-UVCI-2026-003',
                'statut' => 'disponible',
                'niveau_batterie' => 100.00,
                'portee_max_km' => 12.00,
                'latitude_actuelle' => 5.3533000,
                'longitude_actuelle' => -3.8965000,
                'altitude_actuelle' => 0.00,
                'vitesse_actuelle' => 0.00,
                'date_mise_en_service' => '2026-02-15',
                'derniere_communication_at' => now()->subMinutes(15),
            ]
        );

        $drone4 = Drone::updateOrCreate(
            ['code_drone' => 'DRN-004'],
            [
                'nom' => 'Épervier UVCI 4',
                'modele' => 'VTOL Hybride Longue Portée 25km',
                'numero_serie' => 'SN-UVCI-2026-004',
                'statut' => 'en_charge',
                'niveau_batterie' => 45.00,
                'portee_max_km' => 25.00,
                'latitude_actuelle' => 5.3551000,
                'longitude_actuelle' => -3.8942000,
                'altitude_actuelle' => 0.00,
                'vitesse_actuelle' => 0.00,
                'date_mise_en_service' => '2026-03-01',
                'derniere_communication_at' => now()->subHours(1),
            ]
        );

        // -------------------------------------------------------------
        // 3. CAMERAS (Table 3/13)
        // -------------------------------------------------------------
        $cam1 = Camera::create([
            'drone_id' => $drone1->id,
            'nom' => 'Caméra 4K Optique Sony Exmor',
            'modele' => 'Sony ILX-LR1 61MP',
            'type_camera' => 'optique',
            'resolution' => '4K Ultra HD (3840x2160)',
            'angle_vision' => '84° FOV',
            'zoom_optique' => '30x Hybride',
            'flux_rtsp_url' => 'rtsp://127.0.0.1:8554/live/drone1',
            'statut' => 'active',
        ]);

        $cam2 = Camera::create([
            'drone_id' => $drone2->id,
            'nom' => 'Caméra Thermique FLIR Duo Pro R',
            'modele' => 'FLIR Duo Pro R 640x512',
            'type_camera' => 'thermique',
            'resolution' => 'Radiométrique HD (640x512)',
            'angle_vision' => '45° FOV',
            'zoom_optique' => '8x Numérique',
            'flux_rtsp_url' => 'rtsp://127.0.0.1:8554/live/drone2_thermal',
            'statut' => 'active',
        ]);

        $cam3 = Camera::create([
            'drone_id' => $drone3->id,
            'nom' => 'Caméra Multispectrale RedEdge-P',
            'modele' => 'MicaSense RedEdge-P Dual',
            'type_camera' => 'multispectrale',
            'resolution' => '5 Bandes Spectraux (2048x1536)',
            'angle_vision' => '50° FOV',
            'zoom_optique' => 'Fixe 5.5mm',
            'flux_rtsp_url' => 'rtsp://127.0.0.1:8554/live/drone3_multi',
            'statut' => 'active',
        ]);

        // -------------------------------------------------------------
        // 4. CAPTEURS (Table 4/13)
        // -------------------------------------------------------------
        Capteur::create([
            'drone_id' => $drone1->id,
            'nom' => 'Sonde Température & Humidité Ambiante',
            'type_capteur' => 'temperature',
            'unite_mesure' => '°C',
            'derniere_valeur' => 29.40,
            'frequence_echantillonnage_hz' => 2,
            'statut' => 'actif',
        ]);

        Capteur::create([
            'drone_id' => $drone1->id,
            'nom' => 'Télémètre Laser Lidar Anti-Collision',
            'type_capteur' => 'lidar',
            'unite_mesure' => 'm',
            'derniere_valeur' => 45.20,
            'frequence_echantillonnage_hz' => 20,
            'statut' => 'actif',
        ]);

        Capteur::create([
            'drone_id' => $drone2->id,
            'nom' => 'Accéléromètre & Analyseur Vibrations Moteurs',
            'type_capteur' => 'vibration',
            'unite_mesure' => 'm/s²',
            'derniere_valeur' => 1.85,
            'frequence_echantillonnage_hz' => 50,
            'statut' => 'actif',
        ]);

        Capteur::create([
            'drone_id' => $drone2->id,
            'nom' => 'Capteur Détecteur Gaz & Fumées MQ-2',
            'type_capteur' => 'gaz',
            'unite_mesure' => 'ppm',
            'derniere_valeur' => 12.00,
            'frequence_echantillonnage_hz' => 1,
            'statut' => 'actif',
        ]);

        // -------------------------------------------------------------
        // 5. ZONES STATIQUES (Table 5/13)
        // -------------------------------------------------------------
        $zone1 = ZoneStatique::create([
            'nom_zone' => 'Parcelle Rizicole Pilote UVCI (Yamoussoukro Sud)',
            'code_zone' => 'PARCELLE-01',
            'type_zone' => 'agricole',
            'surface_hectares' => 18.50,
            'latitude_centre' => 5.3551000,
            'longitude_centre' => -3.8942000,
            'altitude_reference' => 60.00,
            'limites_gps' => [
                'type' => 'Polygon',
                'coordinates' => [[
                    [-3.8980, 5.3520],
                    [-3.8900, 5.3520],
                    [-3.8900, 5.3580],
                    [-3.8980, 5.3580],
                    [-3.8980, 5.3520],
                ]]
            ],
            'niveau_risque' => 'modere',
            'description' => 'Zone d\'expérimentation agro-technologique de riz pluvial à haut rendement.',
        ]);

        $zone2 = ZoneStatique::create([
            'nom_zone' => 'Poste Électrique & Ligne Haute Tension FabLab',
            'code_zone' => 'INFRA-01',
            'type_zone' => 'infrastructure',
            'surface_hectares' => 8.20,
            'latitude_centre' => 5.3590000,
            'longitude_centre' => -3.8910000,
            'altitude_reference' => 75.00,
            'limites_gps' => [
                'type' => 'Polygon',
                'coordinates' => [[
                    [-3.8930, 5.3570],
                    [-3.8880, 5.3570],
                    [-3.8880, 5.3610],
                    [-3.8930, 5.3610],
                    [-3.8930, 5.3570],
                ]]
            ],
            'niveau_risque' => 'eleve',
            'description' => 'Corridor d\'inspection des pylônes, transformateurs et câbles d\'énergie.',
        ]);

        // -------------------------------------------------------------
        // 6. MISSIONS (Table 6/13)
        // -------------------------------------------------------------
        $mission1 = Mission::create([
            'code_mission' => 'MSN-2026-001',
            'nom' => 'Surveillance Thermographique & Détection des Pannes Matérielles',
            'type_mission' => 'detection_pannes',
            'statut' => 'en_cours',
            'utilisateur_id' => $admin->id,
            'zone_statique_id' => $zone1->id,
            'date_debut_prevue' => now()->subMinutes(30),
            'date_fin_prevue' => now()->addMinutes(45),
            'date_debut_reelle' => now()->subMinutes(25),
            'altitude_vol_m' => 45.00,
            'vitesse_croisiere_ms' => 8.50,
            'description' => 'Patrouille autonome de détection précoce des surchauffes et pannes d\'équipements.',
        ]);

        $mission2 = Mission::create([
            'code_mission' => 'MSN-2026-002',
            'nom' => 'Inspection Pylônes & Câbles Haute Tension',
            'type_mission' => 'inspection',
            'statut' => 'planifiee',
            'utilisateur_id' => $pilote->id,
            'zone_statique_id' => $zone2->id,
            'date_debut_prevue' => now()->addHours(2),
            'date_fin_prevue' => now()->addHours(4),
            'altitude_vol_m' => 60.00,
            'vitesse_croisiere_ms' => 6.00,
            'description' => 'Reconnaissance vidéo haute définition des isolateurs et joints de lignes.',
        ]);

        $mission3 = Mission::create([
            'code_mission' => 'MSN-2026-003',
            'nom' => 'Effarouchement Acoustique & Cartographie Parcelle',
            'type_mission' => 'effarouchement',
            'statut' => 'terminee',
            'utilisateur_id' => $admin->id,
            'zone_statique_id' => $zone1->id,
            'date_debut_prevue' => now()->subDays(1)->setTime(8, 0),
            'date_fin_prevue' => now()->subDays(1)->setTime(9, 30),
            'date_debut_reelle' => now()->subDays(1)->setTime(8, 5),
            'date_fin_reelle' => now()->subDays(1)->setTime(9, 25),
            'altitude_vol_m' => 35.00,
            'vitesse_croisiere_ms' => 7.50,
            'description' => 'Mission terminée avec succès : 3 émissions sonores répulsives diffusées.',
        ]);

        // -------------------------------------------------------------
        // 7. DRONE_MISSION (Table Pivot autorisée N:N)
        // -------------------------------------------------------------
        $mission1->drones()->attach([
            $drone2->id => ['role_drone' => 'principal', 'statut' => 'en_vol'],
            $drone1->id => ['role_drone' => 'relais', 'statut' => 'assigne'],
        ]);

        $mission2->drones()->attach([
            $drone1->id => ['role_drone' => 'principal', 'statut' => 'assigne'],
        ]);

        $mission3->drones()->attach([
            $drone3->id => ['role_drone' => 'principal', 'statut' => 'termine'],
        ]);

        // -------------------------------------------------------------
        // 8. PLANIFICATIONS_VOL (Table 7/13)
        // -------------------------------------------------------------
        PlanificationVol::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'numero_ordre' => 1,
            'point_depart' => 'Station Sol FabLab Alpha',
            'point_arrivee' => 'Waypoint Alpha 1 (Secteur Nord)',
            'latitude' => 5.3551000,
            'longitude' => -3.8942000,
            'altitude_m' => 45.00,
            'vitesse_prevue_ms' => 8.50,
            'date_heure_depart_prevue' => now()->subMinutes(25),
            'date_heure_arrivee_prevue' => now()->subMinutes(20),
            'statut' => 'valide',
        ]);

        PlanificationVol::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'numero_ordre' => 2,
            'point_depart' => 'Waypoint Alpha 1',
            'point_arrivee' => 'Waypoint Alpha 2 (Secteur Est)',
            'latitude' => 5.3582000,
            'longitude' => -3.8914000,
            'altitude_m' => 45.00,
            'vitesse_prevue_ms' => 8.50,
            'date_heure_depart_prevue' => now()->subMinutes(20),
            'date_heure_arrivee_prevue' => now()->addMinutes(10),
            'statut' => 'en_cours',
        ]);

        PlanificationVol::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'numero_ordre' => 3,
            'point_depart' => 'Waypoint Alpha 2',
            'point_arrivee' => 'Station Sol FabLab Alpha (RTH)',
            'latitude' => 5.3551000,
            'longitude' => -3.8942000,
            'altitude_m' => 30.00,
            'vitesse_prevue_ms' => 9.00,
            'date_heure_depart_prevue' => now()->addMinutes(10),
            'date_heure_arrivee_prevue' => now()->addMinutes(25),
            'statut' => 'en_attente',
        ]);

        // -------------------------------------------------------------
        // 9. VIDEOS (Table 8/13)
        // -------------------------------------------------------------
        Video::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'camera_id' => $cam2->id,
            'titre' => 'Enregistrement Vidéo Thermique Mission MSN-2026-001',
            'chemin_fichier' => '/storage/videos/mission_msn001_thermique.mp4',
            'format' => 'mp4',
            'resolution' => '1920x1080',
            'duree_secondes' => 480,
            'taille_octets' => 125829120, // ~120 Mo
            'date_enregistrement' => now()->subMinutes(20),
        ]);

        Video::create([
            'mission_id' => $mission3->id,
            'drone_id' => $drone3->id,
            'camera_id' => $cam3->id,
            'titre' => 'Survol Multispectral Riziculture Mission MSN-2026-003',
            'chemin_fichier' => '/storage/videos/mission_msn003_multispectral.mp4',
            'format' => 'mp4',
            'resolution' => '3840x2160',
            'duree_secondes' => 720,
            'taille_octets' => 345000000,
            'date_enregistrement' => now()->subDays(1),
        ]);

        // -------------------------------------------------------------
        // 10. SONS (Table 9/13)
        // -------------------------------------------------------------
        Son::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'titre' => 'Cri d\'Attaque Faucon Pèlerin (Répulsif Agro)',
            'chemin_fichier' => '/audio/repulsifs/faucon_pelerin_cri.wav',
            'type_son' => 'repulsif',
            'frequence_hz' => 44100,
            'decibels' => 92.50,
            'duree_secondes' => 12,
            'taille_octets' => 176444,
            'actif' => true,
            'date_enregistrement' => now(),
        ]);

        Son::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'titre' => 'Détonation Canon Gaz Synthétique',
            'chemin_fichier' => '/audio/repulsifs/detonation_canon.wav',
            'type_son' => 'repulsif',
            'frequence_hz' => 44100,
            'decibels' => 105.00,
            'duree_secondes' => 8,
            'taille_octets' => 132344,
            'actif' => true,
            'date_enregistrement' => now(),
        ]);

        Son::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'titre' => 'Sirène d\'Alerte & Balise Sonore DISDP',
            'chemin_fichier' => '/audio/repulsifs/sirene_alerte_agro.wav',
            'type_son' => 'alarme',
            'frequence_hz' => 48000,
            'decibels' => 98.00,
            'duree_secondes' => 15,
            'taille_octets' => 176444,
            'actif' => true,
            'date_enregistrement' => now(),
        ]);

        Son::create([
            'mission_id' => null,
            'drone_id' => $drone1->id,
            'titre' => 'Tonalité Moteurs Brushless Pixhawk 4',
            'chemin_fichier' => '/audio/drone/drone_motor_startup.wav',
            'type_son' => 'bruit_moteur',
            'frequence_hz' => 44100,
            'decibels' => 74.00,
            'duree_secondes' => 6,
            'taille_octets' => 154394,
            'actif' => true,
            'date_enregistrement' => now(),
        ]);

        // -------------------------------------------------------------
        // 11. DETECTIONS (Table 10/13)
        // -------------------------------------------------------------
        $det1 = Detection::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'type_detection' => 'panne_materielle',
            'cible_detectee' => 'Surchauffe Contrôleur ESC Moteur 3 (78.4°C)',
            'confiance_pct' => 95.80,
            'latitude' => 5.3582000,
            'longitude' => -3.8914000,
            'altitude_m' => 45.00,
            'date_detection' => now()->subMinutes(12),
            'niveau_gravite' => 'critique',
            'details' => 'Gradient thermique anormal détecté par caméra FLIR sur l\'axe du rotor numéro 3.',
            'photo_snapshot_url' => '/storage/snapshots/panne_esc_moteur3.jpg',
            'statut' => 'confirmee',
        ]);

        $det2 = Detection::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'type_detection' => 'animal_ravageur',
            'cible_detectee' => 'Bande de Calaos à bec noir (14 individus)',
            'confiance_pct' => 92.40,
            'latitude' => 5.3567000,
            'longitude' => -3.8928000,
            'altitude_m' => 45.00,
            'date_detection' => now()->subMinutes(18),
            'niveau_gravite' => 'eleve',
            'details' => 'Groupe de volatiles en approche de la parcelle rizicole en phase de maturation.',
            'photo_snapshot_url' => '/storage/snapshots/volatiles_calao_zone1.jpg',
            'statut' => 'confirmee',
        ]);

        $det3 = Detection::create([
            'mission_id' => $mission1->id,
            'drone_id' => $drone2->id,
            'type_detection' => 'obstacle',
            'cible_detectee' => 'Câble haute tension affaissé à 18m du sol',
            'confiance_pct' => 88.70,
            'latitude' => 5.3591000,
            'longitude' => -3.8905000,
            'altitude_m' => 30.00,
            'date_detection' => now()->subMinutes(5),
            'niveau_gravite' => 'eleve',
            'details' => 'Obstacle imprévu détecté par télémètre lidar en limite de parcelle.',
            'photo_snapshot_url' => '/storage/snapshots/obstacle_cable_ht.jpg',
            'statut' => 'a_traiter',
        ]);

        // -------------------------------------------------------------
        // 12. INCIDENTS (Table 11/13)
        // -------------------------------------------------------------
        Incident::create([
            'code_incident' => 'INC-2026-001',
            'mission_id' => $mission1->id,
            'detection_id' => $det1->id,
            'drone_id' => $drone2->id,
            'titre' => 'Surchauffe critique ESC & Risque Défaillance Moteur 3',
            'description' => 'Température ESC supérieure au seuil maximal constructeur (75°C). Réduction automatique de la poussée appliquée par le pilote automatique Pixhawk.',
            'type_incident' => 'panne_moteur',
            'gravite' => 'critique',
            'statut' => 'en_analyse',
            'latitude' => 5.3582000,
            'longitude' => -3.8914000,
            'date_incident' => now()->subMinutes(12),
            'date_resolution' => null,
            'solution_apportee' => null,
        ]);

        Incident::create([
            'code_incident' => 'INC-2026-002',
            'mission_id' => $mission1->id,
            'detection_id' => null,
            'drone_id' => $drone1->id,
            'titre' => 'Micro-coupure liaison télémétrique LoRa 868 MHz',
            'description' => 'Perte de trames télémétriques pendant 3.2 secondes lors du passage derrière l\'obstacle forestier.',
            'type_incident' => 'perte_liaison_lora',
            'gravite' => 'moyenne',
            'statut' => 'resolu',
            'latitude' => 5.3551000,
            'longitude' => -3.8942000,
            'date_incident' => now()->subMinutes(22),
            'date_resolution' => now()->subMinutes(21),
            'solution_apportee' => 'Bascule automatique sur le canal de secours 2.4 GHz et recalibration d\'antenne.',
        ]);

        // -------------------------------------------------------------
        // 13. INSPECTIONS (Table 12/13)
        // -------------------------------------------------------------
        Inspection::create([
            'code_inspection' => 'INSP-2026-001',
            'drone_id' => $drone1->id,
            'utilisateur_id' => $tech->id,
            'type_inspection' => 'pre_vol',
            'date_inspection' => now()->subHours(1),
            'etat_helices' => 'conforme',
            'etat_moteurs' => 'conforme',
            'etat_batterie' => 'conforme (96.5% · 22.2V)',
            'etat_capteurs' => 'conforme (étalonnage OK)',
            'etat_cameras' => 'conforme',
            'etat_chassis' => 'conforme (fibre carbone intacte)',
            'resultat_global' => 'apte_au_vol',
            'commentaires' => 'Drone en parfait état mécanique et électronique. Prêt pour les missions journalières.',
        ]);

        Inspection::create([
            'code_inspection' => 'INSP-2026-002',
            'drone_id' => $drone4->id,
            'utilisateur_id' => $tech->id,
            'type_inspection' => 'maintenance_periodique',
            'date_inspection' => now()->subDays(2),
            'etat_helices' => 'usure_moderee',
            'etat_moteurs' => 'conforme',
            'etat_batterie' => 'cyclage_en_cours',
            'etat_capteurs' => 'conforme',
            'etat_cameras' => 'conforme',
            'etat_chassis' => 'conforme',
            'resultat_global' => 'maintenance_requise',
            'commentaires' => 'Remplacement préventif des hélices arrière gauche prévu avant le prochain vol de 25km.',
        ]);

        // -------------------------------------------------------------
        // 14. HISTORIQUES (Table 13/13)
        // -------------------------------------------------------------
        Historique::create([
            'utilisateur_id' => $admin->id,
            'drone_id' => $drone1->id,
            'mission_id' => null,
            'action' => 'connexion_station',
            'description' => 'Connexion radio du Drone Faucon UVCI 1 à la Station de Base FabLab UVCI Alpha-1 (LoRa 868 MHz).',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'DISDP Cockpit GCS v2.0',
            'details_json' => ['signal_dbm' => -62, 'protocole' => 'MAVLink 2.0'],
            'date_action' => now()->subMinutes(40),
        ]);

        Historique::create([
            'utilisateur_id' => $admin->id,
            'drone_id' => $drone2->id,
            'mission_id' => $mission1->id,
            'action' => 'demarrage_vol',
            'description' => 'Décollage VTOL réussi et activation de la patrouille de détection des pannes.',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'DISDP Cockpit GCS v2.0',
            'details_json' => ['altitude_cible' => 45.0, 'vitesse_ms' => 8.5],
            'date_action' => now()->subMinutes(25),
        ]);

        Historique::create([
            'utilisateur_id' => $admin->id,
            'drone_id' => $drone2->id,
            'mission_id' => $mission1->id,
            'action' => 'declenchement_son',
            'description' => 'Émission répulsive acoustique "Cri d\'Attaque Faucon Pèlerin" déclenchée à 92 dB.',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'DISDP Cockpit GCS v2.0',
            'details_json' => ['son_id' => 1, 'volume_pct' => 90],
            'date_action' => now()->subMinutes(17),
        ]);

        Historique::create([
            'utilisateur_id' => $tech->id,
            'drone_id' => $drone1->id,
            'mission_id' => null,
            'action' => 'inspection_effectuee',
            'description' => 'Rapport d\'inspection pré-vol INSP-2026-001 validé par la technicienne Awa Touré.',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'DISDP Mobile GCS v2.0',
            'details_json' => ['resultat' => 'apte_au_vol'],
            'date_action' => now()->subHours(1),
        ]);
    }
}
