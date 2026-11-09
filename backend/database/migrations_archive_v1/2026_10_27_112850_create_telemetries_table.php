<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telemetries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drone_id')->constrained()->onDelete('cascade');
            $table->integer('batterie')->default(84);
            $table->float('vitesse')->default(0.4);
            $table->float('altitude')->default(0.46);
            $table->float('signal_db')->default(-0.45);
            $table->float('moteur_1')->default(0);
            $table->float('moteur_2')->default(0);
            $table->float('moteur_3')->default(0);
            $table->float('moteur_4')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telemetries');
    }
};