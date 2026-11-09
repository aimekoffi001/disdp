<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Drone extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'drones';

    protected $fillable = [
        'nom',
        'code_drone',
        'modele',
        'numero_serie',
        'statut',
        'niveau_batterie',
        'portee_max_km',
        'latitude_actuelle',
        'longitude_actuelle',
        'altitude_actuelle',
        'vitesse_actuelle',
        'date_mise_en_service',
        'derniere_communication_at',
    ];

    protected function casts(): array
    {
        return [
            'niveau_batterie' => 'decimal:2',
            'portee_max_km' => 'decimal:2',
            'latitude_actuelle' => 'decimal:7',
            'longitude_actuelle' => 'decimal:7',
            'altitude_actuelle' => 'decimal:2',
            'vitesse_actuelle' => 'decimal:2',
            'date_mise_en_service' => 'date',
            'derniere_communication_at' => 'datetime',
        ];
    }

    /**
     * Relation : Un drone peut avoir plusieurs caméras.
     */
    public function cameras(): HasMany
    {
        return $this->hasMany(Camera::class, 'drone_id');
    }

    /**
     * Relation : Un drone peut posséder plusieurs capteurs.
     */
    public function capteurs(): HasMany
    {
        return $this->hasMany(Capteur::class, 'drone_id');
    }

    /**
     * Relation : Un drone peut effectuer plusieurs missions (Many-to-Many).
     */
    public function missions(): BelongsToMany
    {
        return $this->belongsToMany(Mission::class, 'drone_mission', 'drone_id', 'mission_id')
            ->withPivot(['role_drone', 'statut'])
            ->withTimestamps();
    }

    /**
     * Relation : Un drone peut subir plusieurs inspections.
     */
    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'drone_id');
    }

    /**
     * Relation : Planifications de vol assignées au drone.
     */
    public function planificationsVol(): HasMany
    {
        return $this->hasMany(PlanificationVol::class, 'drone_id');
    }

    /**
     * Relation : Vidéos enregistrées par ce drone.
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'drone_id');
    }

    /**
     * Relation : Enregistrements sonores captés par ce drone.
     */
    public function sons(): HasMany
    {
        return $this->hasMany(Son::class, 'drone_id');
    }

    /**
     * Relation : Détections opérées par ce drone.
     */
    public function detections(): HasMany
    {
        return $this->hasMany(Detection::class, 'drone_id');
    }

    /**
     * Relation : Incidents survenus sur ce drone.
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'drone_id');
    }

    /**
     * Relation : Historique d'actions lié à ce drone.
     */
    public function historiques(): HasMany
    {
        return $this->hasMany(Historique::class, 'drone_id');
    }
}
