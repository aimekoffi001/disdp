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
        Schema::create('drones', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('code_drone', 50)->unique();
            $table->string('modele', 100);
            $table->string('numero_serie', 100)->unique();
            $table->string('statut', 50)->default('disponible'); // disponible, en_vol, en_mission, en_retour_base, en_charge, en_maintenance, hors_ligne
            $table->decimal('niveau_batterie', 5, 2)->default(100.00); // 0.00 à 100.00 %
            $table->decimal('portee_max_km', 5, 2)->default(15.00);
            $table->decimal('latitude_actuelle', 10, 7)->nullable(); // GPS WGS84
            $table->decimal('longitude_actuelle', 10, 7)->nullable();
            $table->decimal('altitude_actuelle', 7, 2)->default(0.00); // en mètres
            $table->decimal('vitesse_actuelle', 5, 2)->default(0.00); // en m/s
            $table->date('date_mise_en_service')->nullable();
            $table->timestamp('derniere_communication_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('statut');
            $table->index(['latitude_actuelle', 'longitude_actuelle']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drones');
    }
};

