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
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained('missions')->onDelete('cascade');
            $table->foreignId('drone_id')->nullable()->constrained('drones')->onDelete('set null');
            $table->foreignId('camera_id')->nullable()->constrained('cameras')->onDelete('set null');
            $table->string('titre', 150);
            $table->string('chemin_fichier', 255); // Chemin relatif du fichier sur le disque (ex: /storage/videos/mission_1.mp4)
            $table->string('format', 20)->default('mp4'); // mp4, webm, mkv
            $table->string('resolution', 50)->default('1920x1080');
            $table->unsignedInteger('duree_secondes')->default(0);
            $table->unsignedBigInteger('taille_octets')->default(0);
            $table->dateTime('date_enregistrement')->nullable();
            $table->timestamps();

            $table->index('mission_id');
            $table->index('drone_id');
            $table->index('date_enregistrement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};

