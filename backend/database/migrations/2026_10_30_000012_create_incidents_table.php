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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('code_incident', 50)->unique();
            $table->foreignId('mission_id')->nullable()->constrained('missions')->onDelete('set null');
            $table->foreignId('detection_id')->nullable()->constrained('detections')->onDelete('set null');
            $table->foreignId('drone_id')->nullable()->constrained('drones')->onDelete('set null');
            $table->string('titre', 150);
            $table->text('description');
            $table->string('type_incident', 50); // panne_moteur, batterie_critique, perte_liaison_lora, collision_evitee, anomalie_capteur, atterrissage_urgence
            $table->string('gravite', 50)->default('moyenne'); // faible, moyenne, elevee, critique
            $table->string('statut', 50)->default('ouvert'); // ouvert, en_analyse, en_reparation, resolu, clos
            $table->decimal('latitude', 10, 7)->nullable(); // GPS WGS84
            $table->decimal('longitude', 10, 7)->nullable();
            $table->dateTime('date_incident');
            $table->dateTime('date_resolution')->nullable();
            $table->text('solution_apportee')->nullable();
            $table->timestamps();

            $table->index('code_incident');
            $table->index('mission_id');
            $table->index('detection_id');
            $table->index('drone_id');
            $table->index('statut');
            $table->index('gravite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};

