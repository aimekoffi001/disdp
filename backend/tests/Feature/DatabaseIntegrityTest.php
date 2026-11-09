<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Vérifie la présence exacte des 13 tables DISDP + la table pivot drone_mission.
     */
    public function test_all_13_tables_and_pivot_exist_in_database(): void
    {
        $expectedTables = [
            'utilisateurs',
            'drones',
            'cameras',
            'capteurs',
            'zones_statiques',
            'missions',
            'drone_mission',
            'planifications_vol',
            'videos',
            'sons',
            'detections',
            'incidents',
            'inspections',
            'historiques',
        ];

        foreach ($expectedTables as $table) {
            $this->assertTrue(Schema::hasTable($table), "La table requise '$table' doit exister dans la base de données.");
        }
    }

    /**
     * Vérifie la présence des colonnes SoftDeletes sur les tables critiques.
     */
    public function test_soft_deletes_columns_exist(): void
    {
        $this->assertTrue(Schema::hasColumn('utilisateurs', 'deleted_at'), "La table 'utilisateurs' doit comporter 'deleted_at'.");
        $this->assertTrue(Schema::hasColumn('drones', 'deleted_at'), "La table 'drones' doit comporter 'deleted_at'.");
        $this->assertTrue(Schema::hasColumn('missions', 'deleted_at'), "La table 'missions' doit comporter 'deleted_at'.");
    }

    /**
     * Vérifie la présence des colonnes GPS clés.
     */
    public function test_gps_coordinates_columns_exist(): void
    {
        $this->assertTrue(Schema::hasColumn('drones', 'latitude_actuelle'));
        $this->assertTrue(Schema::hasColumn('drones', 'longitude_actuelle'));
        $this->assertTrue(Schema::hasColumn('zones_statiques', 'latitude_centre'));
        $this->assertTrue(Schema::hasColumn('zones_statiques', 'longitude_centre'));
        $this->assertTrue(Schema::hasColumn('planifications_vol', 'latitude'));
        $this->assertTrue(Schema::hasColumn('planifications_vol', 'longitude'));
        $this->assertTrue(Schema::hasColumn('detections', 'latitude'));
        $this->assertTrue(Schema::hasColumn('detections', 'longitude'));
    }

    /**
     * Vérifie le stockage par chemin de fichier pour vidéos et sons (non binaires dans MySQL).
     */
    public function test_file_paths_columns_exist_for_media(): void
    {
        $this->assertTrue(Schema::hasColumn('videos', 'chemin_fichier'));
        $this->assertTrue(Schema::hasColumn('sons', 'chemin_fichier'));
    }
}
