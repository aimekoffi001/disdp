<?php

namespace Tests\Feature;

use App\Models\Drone;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\Son;
use App\Models\Utilisateur;
use App\Models\ZoneStatique;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardViewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Teste que la page du cockpit et l'API retournent 200 OK.
     */
    public function test_dashboard_renders_successfully(): void
    {
        $response = $this->get('/cockpit');
        $response->assertStatus(200);
        $response->assertSee('DISDP');
    }

    /**
     * Teste l'API JSON du tableau de bord.
     */
    public function test_api_dashboard_returns_full_json(): void
    {
        $response = $this->getJson('/api/dashboard');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user',
            'drones',
            'selected_drone',
            'latest_telemetry',
            'current_mission',
            'kpi',
            'missions',
            'incidents',
            'detections',
            'zones',
            'sons',
            'inspections',
            'historiques',
        ]);
    }

    /**
     * Teste la connexion à la station de base.
     */
    public function test_can_connect_drone_to_base_station(): void
    {
        $drone = Drone::where('code_drone', 'DRN-001')->first();

        $response = $this->postJson("/drones/{$drone->id}/connecter-station");
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('station_base.connecte', true);
    }

    /**
     * Teste le décollage du drone.
     */
    public function test_can_start_drone_and_takeoff(): void
    {
        $drone = Drone::where('code_drone', 'DRN-001')->first();

        $response = $this->postJson("/drones/{$drone->id}/demarrer-vol");
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('drone.statut', 'en_vol');
    }

    /**
     * Teste l'atterrissage du drone.
     */
    public function test_can_land_drone(): void
    {
        $drone = Drone::where('statut', 'en_vol')->first();

        $response = $this->postJson("/drones/{$drone->id}/atterrir");
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('drone.statut', 'disponible');
    }

    /**
     * Teste le changement de statut d'un drone.
     */
    public function test_can_change_drone_status(): void
    {
        $drone = Drone::first();

        $response = $this->postJson("/drones/{$drone->id}/statut", [
            'statut' => 'en_maintenance',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('en_maintenance', $drone->fresh()->statut);
    }

    /**
     * Teste la simulation de détection IA et création d'incident.
     */
    public function test_can_simulate_ai_detection(): void
    {
        $drone = Drone::first();

        $response = $this->postJson("/drones/{$drone->id}/simuler-detection");
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    /**
     * Teste la création d'une nouvelle mission avec assignation du drone.
     */
    public function test_can_create_new_mission(): void
    {
        $drone = Drone::first();
        $zone = ZoneStatique::first();

        $response = $this->postJson('/missions/creer', [
            'nom' => 'Nouvelle Mission Test',
            'type_mission' => 'surveillance',
            'drone_id' => $drone->id,
            'zone_statique_id' => $zone->id,
            'altitude_vol_m' => 45.0,
            'vitesse_croisiere_ms' => 8.0,
            'description' => 'Test création mission',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('missions', ['nom' => 'Nouvelle Mission Test']);
    }

    /**
     * Teste la résolution d'un incident.
     */
    public function test_can_resolve_incident(): void
    {
        $incident = Incident::first();

        $response = $this->postJson("/alertes/{$incident->id}/resoudre");
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertEquals('resolu', $incident->fresh()->statut);
    }

    /**
     * Teste la création d'un nouveau drone dans la flotte.
     */
    public function test_can_create_new_drone(): void
    {
        $response = $this->postJson('/drones', [
            'nom' => 'Nouveau Drone Alpha',
            'code_drone' => 'DRN-NEW-01',
            'modele' => 'Hexacopter Pro',
            'numero_serie' => 'SN-NEW-999',
            'portee_max_km' => 20.0,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('drones', ['code_drone' => 'DRN-NEW-01']);
    }
}
