<?php

namespace Tests\Feature;

use App\Models\Drone;
use App\Models\Incident;
use App\Models\Mission;
use App\Models\Utilisateur;
use App\Models\ZoneStatique;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseConstraintsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Teste l'unicité du code_drone.
     */
    public function test_drone_code_drone_must_be_unique(): void
    {
        Drone::create([
            'nom' => 'Drone 1',
            'code_drone' => 'DRN-UNIQUE',
            'modele' => 'Hexacopter',
            'numero_serie' => 'SN-001',
        ]);

        $this->expectException(QueryException::class);

        Drone::create([
            'nom' => 'Drone 2',
            'code_drone' => 'DRN-UNIQUE', // Doublon intentionnel
            'modele' => 'Quadricopter',
            'numero_serie' => 'SN-002',
        ]);
    }

    /**
     * Teste l'unicité de l'email utilisateur.
     */
    public function test_utilisateur_email_must_be_unique(): void
    {
        Utilisateur::create([
            'nom' => 'User 1',
            'prenom' => 'Jean',
            'email' => 'unique@fablab.ci',
            'password' => 'secret',
        ]);

        $this->expectException(QueryException::class);

        Utilisateur::create([
            'nom' => 'User 2',
            'prenom' => 'Paul',
            'email' => 'unique@fablab.ci', // Doublon intentionnel
            'password' => 'secret',
        ]);
    }

    /**
     * Teste l'unicité du code_mission.
     */
    public function test_code_mission_must_be_unique(): void
    {
        $user = Utilisateur::create([
            'nom' => 'Admin',
            'prenom' => 'Test',
            'email' => 'admin.test@fablab.ci',
            'password' => 'secret',
        ]);

        Mission::create([
            'code_mission' => 'MSN-UNIQUE-01',
            'nom' => 'Mission 1',
            'utilisateur_id' => $user->id,
            'date_debut_prevue' => now(),
        ]);

        $this->expectException(QueryException::class);

        Mission::create([
            'code_mission' => 'MSN-UNIQUE-01', // Doublon intentionnel
            'nom' => 'Mission 2',
            'utilisateur_id' => $user->id,
            'date_debut_prevue' => now(),
        ]);
    }

    /**
     * Teste l'unicité du pivot drone_mission.
     */
    public function test_drone_mission_pivot_must_be_unique(): void
    {
        $user = Utilisateur::create([
            'nom' => 'Admin',
            'prenom' => 'Test',
            'email' => 'admin.pivot@fablab.ci',
            'password' => 'secret',
        ]);

        $drone = Drone::create([
            'nom' => 'Drone Pivot',
            'code_drone' => 'DRN-PIVOT',
            'modele' => 'Hexacopter',
            'numero_serie' => 'SN-PIVOT',
        ]);

        $mission = Mission::create([
            'code_mission' => 'MSN-PIVOT-01',
            'nom' => 'Mission Pivot',
            'utilisateur_id' => $user->id,
            'date_debut_prevue' => now(),
        ]);

        $mission->drones()->attach($drone->id);

        $this->expectException(QueryException::class);

        // Tentative de rattachement en doublon
        $mission->drones()->attach($drone->id);
    }
}
