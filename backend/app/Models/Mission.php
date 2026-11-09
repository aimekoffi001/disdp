<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mission extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'missions';

    protected $fillable = [
        'code_mission',
        'nom',
        'type_mission',
        'statut',
        'utilisateur_id',
        'zone_statique_id',
        'date_debut_prevue',
        'date_fin_prevue',
        'date_debut_reelle',
        'date_fin_reelle',
        'altitude_vol_m',
        'vitesse_croisiere_ms',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'date_debut_prevue' => 'datetime',
            'date_fin_prevue' => 'datetime',
            'date_debut_reelle' => 'datetime',
            'date_fin_reelle' => 'datetime',
            'altitude_vol_m' => 'decimal:2',
            'vitesse_croisiere_ms' => 'decimal:2',
        ];
    }

    /**
     * Relation : Un utilisateur peut créer plusieurs missions.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }

    /**
     * Relation : Une zone statique peut être associée à plusieurs missions.
     */
    public function zoneStatique(): BelongsTo
    {
        return $this->belongsTo(ZoneStatique::class, 'zone_statique_id');
    }

    /**
     * Relation : Une mission peut mobiliser plusieurs drones (Many-to-Many).
     */
    public function drones(): BelongsToMany
    {
        return $this->belongsToMany(Drone::class, 'drone_mission', 'mission_id', 'drone_id')
            ->withPivot(['role_drone', 'statut'])
            ->withTimestamps();
    }

    /**
     * Relation : Une mission peut avoir plusieurs planifications de vol.
     */
    public function planificationsVol(): HasMany
    {
        return $this->hasMany(PlanificationVol::class, 'mission_id');
    }

    /**
     * Relation : Une mission peut produire plusieurs vidéos.
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'mission_id');
    }

    /**
     * Relation : Une mission peut produire plusieurs enregistrements sonores.
     */
    public function sons(): HasMany
    {
        return $this->hasMany(Son::class, 'mission_id');
    }

    /**
     * Relation : Une mission peut générer plusieurs détections.
     */
    public function detections(): HasMany
    {
        return $this->hasMany(Detection::class, 'mission_id');
    }

    /**
     * Relation : Une mission peut être associée à plusieurs incidents.
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'mission_id');
    }

    /**
     * Relation : Historiques enregistrés pour cette mission.
     */
    public function historiques(): HasMany
    {
        return $this->hasMany(Historique::class, 'mission_id');
    }
}
