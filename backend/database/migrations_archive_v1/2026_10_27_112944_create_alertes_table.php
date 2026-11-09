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
        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('alertes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('drone_id')->constrained()->cascadeOnDelete();
    $table->foreignId('vol_id')->nullable()->constrained('vols')->nullOnDelete();
    $table->enum('niveau', ['info', 'avertissement', 'critique'])->default('info');
    $table->string('type', 50);
    $table->text('message');
    $table->dateTime('resolue_at')->nullable();
    $table->timestamps();
    $table->index(['drone_id', 'niveau']);
});
    }
};
