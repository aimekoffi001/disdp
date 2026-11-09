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
        Schema::create('capteurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drone_id')->constrained('drones')->onDelete('cascade');
            $table->string('nom', 100);
            $table->string('type_capteur', 50); // ultrason, infrarouge, temperature, humidite, lidar, vibration, gaz
            $table->string('unite_mesure', 30); // °C, %, m, ppm, dB, m/s²
            $table->decimal('derniere_valeur', 8, 2)->nullable();
            $table->unsignedInteger('frequence_echantillonnage_hz')->default(1);
            $table->string('statut', 50)->default('actif'); // actif, inactif, etalonnage, defaillant
            $table->timestamps();

            $table->index('drone_id');
            $table->index('type_capteur');
            $table->index('statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capteurs');
    }
};

