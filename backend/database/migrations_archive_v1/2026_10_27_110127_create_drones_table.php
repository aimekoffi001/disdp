<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drones', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 50);
            $table->string('code', 20)->unique();
            $table->string('modele', 100)->nullable();
            $table->string('numero_serie', 100)->unique();
            $table->enum('statut', ['en_vol','au_sol','maintenance'])->default('au_sol');
            $table->integer('batterie')->default(100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drones');
    }
};