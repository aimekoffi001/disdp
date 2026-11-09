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
        Schema::create('drone_mission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drone_id')->constrained('drones')->onDelete('cascade');
            $table->foreignId('mission_id')->constrained('missions')->onDelete('cascade');
            $table->string('role_drone', 50)->default('principal'); // principal, relais, camera_secondaire, secours
            $table->string('statut', 50)->default('assigne'); // assigne, en_vol, termine, retire
            $table->timestamps();

            $table->unique(['drone_id', 'mission_id']);
            $table->index('drone_id');
            $table->index('mission_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drone_mission');
    }
};

