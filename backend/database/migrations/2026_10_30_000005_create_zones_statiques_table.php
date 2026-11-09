<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('zones_statiques', function (Blueprint $table) {
            $table->id();
            $table->string('nom_zone', 150);
            $table->string('code_zone', 50)->unique();
            $table->string('type_zone', 50)->default('agricole'); // agricole, industrielle, forestiere, infrastructure
            $table->decimal('surface_hectares', 8, 2)->default(0.00);
            $table->decimal('latitude_centre', 10, 7); // GPS WGS84
            $table->decimal('longitude_centre', 10, 7);
            $table->decimal('altitude_reference', 7, 2)->default(0.00);
            $table->json('limites_gps')->nullable(); // Polygone GeoJSON des contours
            $table->string('niveau_risque', 50)->default('modere'); // faible, modere, eleve, critique
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['latitude_centre', 'longitude_centre']);
            $table->index('type_zone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zones_statiques');
    }
};

