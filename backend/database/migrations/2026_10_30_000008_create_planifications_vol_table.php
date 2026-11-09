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
        Schema::create('planifications_vol', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained('missions')->onDelete('cascade');
            $table->foreignId('drone_id')->nullable()->constrained('drones')->onDelete('set null');
            $table->unsignedInteger('numero_ordre')->default(1);
            $table->string('point_depart', 100)->nullable();
            $table->string('point_arrivee', 100)->nullable();
            $table->decimal('latitude', 10, 7); // Coordonnées GPS du waypoint / vol
            $table->decimal('longitude', 10, 7);
            $table->decimal('altitude_m', 6, 2)->default(45.00);
            $table->decimal('vitesse_prevue_ms', 5, 2)->default(8.00);
            $table->dateTime('date_heure_depart_prevue');
            $table->dateTime('date_heure_arrivee_prevue')->nullable();
            $table->string('statut', 50)->default('en_attente'); // en_attente, en_cours, valide, annule
            $table->timestamps();

            $table->index('mission_id');
            $table->index('drone_id');
            $table->index('statut');
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planifications_vol');
    }
};

