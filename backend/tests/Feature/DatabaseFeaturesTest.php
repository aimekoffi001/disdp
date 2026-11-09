<?php

namespace Tests\Feature;

use App\Models\Drone;
use App\Models\Mission;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseFeaturesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste le fonctionnement du Soft Delete sur le modèle Drone.
     */
    public function test_drone_soft_delete_preserves_record_in_database(): void
    {
        $drone = Drone::create([
            'nom' => 'Drone Soft Delete',
            'code_drone' => 'DRN-SOFT-DEL',
            'modele' => 'Hexacopter',
            'numero_serie' => 'SN-DEL-001',
            'statut' => 'disponible',
            'niveau_batterie' => 100.0,
        ]);

        $droneId = $drone->id;
        $drone->delete();

        // Introuvable par les requêtes Eloquent classiques
        $this->assertNull(Drone::find($droneId));

        // Retrouvable avec withTrashed()
        $this->assertNotNull(Drone::withTrashed()->find($droneId));

        // Toujours physiquement présent dans la table MySQL
        $rawRecord = DB::table('drones')->where('id', $droneId)->first();
        $this->assertNotNull($rawRecord);
        $this->assertNotNull($rawRecord->deleted_at);
    }

    /**
     * Teste le bon typage numérique et décimal.
     */
    public function test_decimal_and_numeric_attributes_casting(): void
    {
        $drone = Drone::create([
            'nom' => 'Drone Cast Test',
            'code_drone' => 'DRN-CAST',
            'modele' => 'Octocopter',
            'numero_serie' => 'SN-CAST-001',
            'niveau_batterie' => 88.45,
            'latitude_actuelle' => 5.3551234,
            'longitude_actuelle' => -3.8942123,
            'altitude_actuelle' => 45.5,
            'vitesse_actuelle' => 8.2,
        ]);

        $fresh = Drone::find($drone->id);
        $this->assertIsNumeric($fresh->niveau_batterie);
        $this->assertIsNumeric($fresh->latitude_actuelle);
        $this->assertIsNumeric($fresh->longitude_actuelle);
        $this->assertIsNumeric($fresh->altitude_actuelle);
        $this->assertIsNumeric($fresh->vitesse_actuelle);
    }
}
