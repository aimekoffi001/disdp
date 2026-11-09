<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moteurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drone_id')->constrained()->onDelete('cascade');
            $table->string('nom', 50); // Moteur 1, Moteur 2...
            $table->string('position', 20)->default('avant_gauche'); // pour la config en X
            $table->enum('statut', ['ok','defaillant','off'])->default('ok');
            $table->integer('vitesse_rpm')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moteurs');
    }
};