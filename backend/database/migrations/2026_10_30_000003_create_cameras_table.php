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
        Schema::create('cameras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drone_id')->constrained('drones')->onDelete('cascade');
            $table->string('nom', 100);
            $table->string('modele', 100);
            $table->string('type_camera', 50)->default('optique'); // optique, thermique, multispectrale, infrarouge
            $table->string('resolution', 50)->default('4K Ultra HD (3840x2160)');
            $table->string('angle_vision', 50)->nullable();
            $table->string('zoom_optique', 20)->nullable();
            $table->string('flux_rtsp_url', 255)->nullable();
            $table->string('statut', 50)->default('active'); // active, en_veille, en_panne
            $table->timestamps();

            $table->index('drone_id');
            $table->index('statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cameras');
    }
};

