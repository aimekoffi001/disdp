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
        Schema::create('mesure_moteurs', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('mesure_moteurs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('telemetry_id')->constrained('telemetries')->cascadeOnDelete();
    $table->foreignId('moteur_id')->constrained('moteurs')->cascadeOnDelete();
    $table->unsignedSmallInteger('rpm')->nullable();
    $table->decimal('temperature_c', 4, 1)->nullable();
    $table->enum('etat', ['ok', 'attention', 'defaillant'])->default('ok');
    $table->timestamps();
});
    }
};
