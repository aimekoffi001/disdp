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
        Schema::create('detections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained('missions')->onDelete('cascade');
            $table->foreignId('drone_id')->nullable()->constrained('drones')->onDelete('set null');
            $table->string('type_detection', 100); // panne_materielle, surchauffe, vibration_anormale, intrusion, animal_ravageur, obstacle
            $table->string('cible_detectee', 150)->nullable(); // ex: "Surchauffe Moteur 3", "Calao", "Câble dénudé"
            $table->decimal('confiance_pct', 5, 2)->default(90.00); // Pourcentage IA (ex: 94.50 %)
            $table->decimal('latitude', 10, 7); // GPS WGS84
            $table->decimal('longitude', 10, 7);
            $table->decimal('altitude_m', 6, 2)->default(0.00);
            $table->dateTime('date_detection');
            $table->string('niveau_gravite', 50)->default('moyen'); // faible, moyen, eleve, critique
            $table->text('details')->nullable();
            $table->string('photo_snapshot_url', 255)->nullable();
            $table->string('statut', 50)->default('a_traiter'); // a_traiter, confirmee, fausse_alerte, resolue
            $table->timestamps();

            $table->index('mission_id');
            $table->index('drone_id');
            $table->index('type_detection');
            $table->index('statut');
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detections');
    }
};

