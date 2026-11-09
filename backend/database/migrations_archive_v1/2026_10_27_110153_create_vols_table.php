<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vols', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drone_id')->constrained()->onDelete('cascade');
            $table->string('mission')->default('Test vol');
            $table->integer('duree_secondes')->default(0);
            $table->float('distance_metres')->default(0);
            $table->float('altitude_max')->default(0);
            $table->integer('batterie_consommee')->default(0);
            $table->enum('statut_vol', ['reussi','echec','en_cours'])->default('reussi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vols');
    }
};