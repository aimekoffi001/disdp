<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanificationVol extends Model
{
    use HasFactory;

    protected $table = 'planifications_vol';

    protected $fillable = [
        'mission_id',
        'drone_id',
        'numero_ordre',
        'point_depart',
        'point_arrivee',
        'latitude',
        'longitude',
        'altitude_m',
        'vitesse_prevue_ms',
        'date_heure_depart_prevue',
        'date_heure_arrivee_prevue',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'numero_ordre' => 'integer',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'altitude_m' => 'decimal:2',
            'vitesse_prevue_ms' => 'decimal:2',
            'date_heure_depart_prevue' => 'datetime',
            'date_heure_arrivee_prevue' => 'datetime',
        ];
    }

    /**
     * Relation : La planification de vol appartient à une mission.
     */
    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    /**
     * Relation : Drone assigné au vol planifié.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }
}

