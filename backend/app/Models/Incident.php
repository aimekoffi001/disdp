<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incident extends Model
{
    use HasFactory;

    protected $table = 'incidents';

    protected $fillable = [
        'code_incident',
        'mission_id',
        'detection_id',
        'drone_id',
        'titre',
        'description',
        'type_incident',
        'gravite',
        'statut',
        'latitude',
        'longitude',
        'date_incident',
        'date_resolution',
        'solution_apportee',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'date_incident' => 'datetime',
            'date_resolution' => 'datetime',
        ];
    }

    /**
     * Relation : Une mission peut être associée à plusieurs incidents.
     */
    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    /**
     * Relation : Une détection peut être associée à un incident.
     */
    public function detection(): BelongsTo
    {
        return $this->belongsTo(Detection::class, 'detection_id');
    }

    /**
     * Relation : Drone concerné par l'incident.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }
}
