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
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->string('code_mission', 50)->unique();
            $table->string('nom', 150);
            $table->string('type_mission', 50)->default('surveillance'); // surveillance, detection_pannes, effarouchement, cartographie, inspection
            $table->string('statut', 50)->default('planifiee'); // planifiee, en_cours, terminee, annulee, interrompue
            $table->foreignId('utilisateur_id')->constrained('utilisateurs')->onDelete('restrict');
            $table->foreignId('zone_statique_id')->nullable()->constrained('zones_statiques')->onDelete('set null');
            $table->dateTime('date_debut_prevue');
            $table->dateTime('date_fin_prevue')->nullable();
            $table->dateTime('date_debut_reelle')->nullable();
            $table->dateTime('date_fin_reelle')->nullable();
            $table->decimal('altitude_vol_m', 6, 2)->default(45.00);
            $table->decimal('vitesse_croisiere_ms', 5, 2)->default(8.00);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('statut');
            $table->index('utilisateur_id');
            $table->index('zone_statique_id');
            $table->index(['date_debut_prevue', 'date_fin_prevue']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};

