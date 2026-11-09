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
        Schema::create('historiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->onDelete('set null');
            $table->foreignId('drone_id')->nullable()->constrained('drones')->onDelete('set null');
            $table->foreignId('mission_id')->nullable()->constrained('missions')->onDelete('set null');
            $table->string('action', 100); // connexion_station, demarrage_vol, atterrissage, declenchement_son, incident_declare, inspection_effectuee
            $table->text('description')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->json('details_json')->nullable();
            $table->timestamp('date_action')->useCurrent();
            $table->timestamps();

            $table->index('utilisateur_id');
            $table->index('drone_id');
            $table->index('mission_id');
            $table->index('action');
            $table->index('date_action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historiques');
    }
};

