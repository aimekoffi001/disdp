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
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->string('code_inspection', 50)->unique();
            $table->foreignId('drone_id')->constrained('drones')->onDelete('cascade');
            $table->foreignId('utilisateur_id')->constrained('utilisateurs')->onDelete('restrict');
            $table->string('type_inspection', 50)->default('pre_vol'); // pre_vol, post_vol, maintenance_periodique, apres_incident
            $table->dateTime('date_inspection');
            $table->string('etat_helices', 50)->default('conforme');
            $table->string('etat_moteurs', 50)->default('conforme');
            $table->string('etat_batterie', 50)->default('conforme');
            $table->string('etat_capteurs', 50)->default('conforme');
            $table->string('etat_cameras', 50)->default('conforme');
            $table->string('etat_chassis', 50)->default('conforme');
            $table->string('resultat_global', 50)->default('apte_au_vol'); // apte_au_vol, maintenance_requise, interdit_de_vol
            $table->text('commentaires')->nullable();
            $table->timestamps();

            $table->index('code_inspection');
            $table->index('drone_id');
            $table->index('utilisateur_id');
            $table->index('resultat_global');
            $table->index('date_inspection');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};

