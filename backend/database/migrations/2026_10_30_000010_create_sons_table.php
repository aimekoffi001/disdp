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
        Schema::create('sons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->nullable()->constrained('missions')->onDelete('set null');
            $table->foreignId('drone_id')->nullable()->constrained('drones')->onDelete('set null');
            $table->string('titre', 150);
            $table->string('chemin_fichier', 255); // Chemin relatif vers le fichier audio (ex: /audio/repulsifs/faucon_pelerin_cri.wav)
            $table->string('type_son', 50)->default('repulsif'); // repulsif, enregistrement, bruit_moteur, alarme
            $table->unsignedInteger('frequence_hz')->default(44100);
            $table->decimal('decibels', 5, 2)->default(85.00);
            $table->unsignedInteger('duree_secondes')->default(0);
            $table->unsignedInteger('taille_octets')->default(0);
            $table->boolean('actif')->default(true);
            $table->dateTime('date_enregistrement')->nullable();
            $table->timestamps();

            $table->index('mission_id');
            $table->index('drone_id');
            $table->index('type_son');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sons');
    }
};

