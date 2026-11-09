<?php

namespace Tests\Feature;

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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseRelationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_13_entities_relations_work_properly(): void
    {
        // 1. Utilisateur
        $user = Utilisateur::create([
            'nom' => 'Kouassi',
            'prenom' => 'Yao',
            'email' => 'yao@fablab.ci',
            'password' => 'secret',
            'role' => 'administrateur',
        ]);

        // 2. Drone
        $drone = Drone::create([
            'nom' => 'Faucon Test',
            'code_drone' => 'DRN-TEST-1',
            'modele' => 'Hexacopter V2',
            'numero_serie' => 'SN-TEST-001',
            'statut' => 'disponible',
            'niveau_batterie' => 95.0,
            'portee_max_km' => 15.0,
        ]);

        // 3. Caméra
        $camera = Camera::create([
            'drone_id' => $drone->id,
            'nom' => 'Caméra Test 4K',
            'modele' => 'Sony Test',
            'type_camera' => 'optique',
        ]);
        $this->assertEquals($drone->id, $camera->drone->id);
        $this->assertTrue($drone->cameras->contains($camera));

        // 4. Capteur
        $capteur = Capteur::create([
            'drone_id' => $drone->id,
            'nom' => 'Lidar Test',
            'type_capteur' => 'lidar',
            'unite_mesure' => 'm',
            'derniere_valeur' => 45.0,
        ]);
        $this->assertEquals($drone->id, $capteur->drone->id);
        $this->assertTrue($drone->capteurs->contains($capteur));

        // 5. Zone Statique
        $zone = ZoneStatique::create([
            'nom_zone' => 'Parcelle Test',
            'code_zone' => 'PARCELLE-TEST',
            'surface_hectares' => 12.5,
            'latitude_centre' => 5.3551,
            'longitude_centre' => -3.8942,
        ]);

        // 6. Mission (créée par utilisateur dans une zone statique)
        $mission = Mission::create([
            'code_mission' => 'MSN-TEST-01',
            'nom' => 'Mission Test Surveillance',
            'type_mission' => 'surveillance',
            'statut' => 'en_cours',
            'utilisateur_id' => $user->id,
            'zone_statique_id' => $zone->id,
            'date_debut_prevue' => now(),
        ]);
        $this->assertEquals($user->id, $mission->utilisateur->id);
        $this->assertEquals($zone->id, $mission->zoneStatique->id);
        $this->assertTrue($user->missions->contains($mission));
        $this->assertTrue($zone->missions->contains($mission));

        // 7. Pivot drone_mission (Many-to-Many entre Drone et Mission)
        $mission->drones()->attach($drone->id, ['role_drone' => 'principal', 'statut' => 'en_vol']);
        $this->assertTrue($mission->drones->contains($drone));
        $this->assertTrue($drone->missions->contains($mission));

        // 8. Planification de Vol
        $plan = PlanificationVol::create([
            'mission_id' => $mission->id,
            'drone_id' => $drone->id,
            'numero_ordre' => 1,
            'latitude' => 5.3551,
            'longitude' => -3.8942,
            'date_heure_depart_prevue' => now(),
        ]);
        $this->assertEquals($mission->id, $plan->mission->id);
        $this->assertTrue($mission->planificationsVol->contains($plan));

        // 9. Vidéo
        $video = Video::create([
            'mission_id' => $mission->id,
            'drone_id' => $drone->id,
            'camera_id' => $camera->id,
            'titre' => 'Vidéo Test',
            'chemin_fichier' => '/storage/videos/test.mp4',
        ]);
        $this->assertEquals($mission->id, $video->mission->id);
        $this->assertTrue($mission->videos->contains($video));

        // 10. Son
        $son = Son::create([
            'mission_id' => $mission->id,
            'drone_id' => $drone->id,
            'titre' => 'Cri Faucon Test',
            'chemin_fichier' => '/audio/test.wav',
            'type_son' => 'repulsif',
        ]);
        $this->assertEquals($mission->id, $son->mission->id);
        $this->assertTrue($mission->sons->contains($son));

        // 11. Détection
        $detection = Detection::create([
            'mission_id' => $mission->id,
            'drone_id' => $drone->id,
            'type_detection' => 'panne_materielle',
            'cible_detectee' => 'Surchauffe ESC 1',
            'latitude' => 5.3551,
            'longitude' => -3.8942,
            'date_detection' => now(),
        ]);
        $this->assertEquals($mission->id, $detection->mission->id);
        $this->assertTrue($mission->detections->contains($detection));

        // 12. Incident (associé à la mission et à la détection)
        $incident = Incident::create([
            'code_incident' => 'INC-TEST-01',
            'mission_id' => $mission->id,
            'detection_id' => $detection->id,
            'drone_id' => $drone->id,
            'titre' => 'Incident Surchauffe',
            'description' => 'Test incident',
            'type_incident' => 'panne_moteur',
            'date_incident' => now(),
        ]);
        $this->assertEquals($mission->id, $incident->mission->id);
        $this->assertEquals($detection->id, $incident->detection->id);
        $this->assertTrue($mission->incidents->contains($incident));
        $this->assertTrue($detection->incidents->contains($incident));

        // 13. Inspection (par utilisateur sur drone)
        $inspection = Inspection::create([
            'code_inspection' => 'INSP-TEST-01',
            'drone_id' => $drone->id,
            'utilisateur_id' => $user->id,
            'type_inspection' => 'pre_vol',
            'date_inspection' => now(),
        ]);
        $this->assertEquals($drone->id, $inspection->drone->id);
        $this->assertEquals($user->id, $inspection->utilisateur->id);
        $this->assertTrue($drone->inspections->contains($inspection));
        $this->assertTrue($user->inspections->contains($inspection));

        // 14. Historique
        $historique = Historique::create([
            'utilisateur_id' => $user->id,
            'drone_id' => $drone->id,
            'mission_id' => $mission->id,
            'action' => 'demarrage_vol',
            'description' => 'Test historique action',
        ]);
        $this->assertEquals($user->id, $historique->utilisateur->id);
        $this->assertTrue($user->historiques->contains($historique));
    }
}
