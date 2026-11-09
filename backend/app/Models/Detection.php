<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Detection extends Model
{
    use HasFactory;

    protected $table = 'detections';

    protected $fillable = [
        'mission_id',
        'drone_id',
        'type_detection',
        'cible_detectee',
        'confiance_pct',
        'latitude',
        'longitude',
        'altitude_m',
        'date_detection',
        'niveau_gravite',
        'details',
        'photo_snapshot_url',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'confiance_pct' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'altitude_m' => 'decimal:2',
            'date_detection' => 'datetime',
        ];
    }

    /**
     * Relation : Une mission peut générer plusieurs détections.
     */
    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    /**
     * Relation : Drone ayant réalisé la détection.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }

    /**
     * Relation : Une détection peut être associée à un ou plusieurs incidents.
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'detection_id');
    }
}
