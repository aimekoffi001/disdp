<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Son extends Model
{
    use HasFactory;

    protected $table = 'sons';

    protected $fillable = [
        'mission_id',
        'drone_id',
        'titre',
        'chemin_fichier',
        'type_son',
        'frequence_hz',
        'decibels',
        'duree_secondes',
        'taille_octets',
        'actif',
        'date_enregistrement',
    ];

    protected function casts(): array
    {
        return [
            'frequence_hz' => 'integer',
            'decibels' => 'decimal:2',
            'duree_secondes' => 'integer',
            'taille_octets' => 'integer',
            'actif' => 'boolean',
            'date_enregistrement' => 'datetime',
        ];
    }

    /**
     * Relation : Le son a été produit lors d'une mission.
     */
    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    /**
     * Relation : Drone émetteur ou récepteur du son.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }
}
