<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Video extends Model
{
    use HasFactory;

    protected $table = 'videos';

    protected $fillable = [
        'mission_id',
        'drone_id',
        'camera_id',
        'titre',
        'chemin_fichier',
        'format',
        'resolution',
        'duree_secondes',
        'taille_octets',
        'date_enregistrement',
    ];

    protected function casts(): array
    {
        return [
            'duree_secondes' => 'integer',
            'taille_octets' => 'integer',
            'date_enregistrement' => 'datetime',
        ];
    }

    /**
     * Relation : La vidéo a été enregistrée pendant une mission.
     */
    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }

    /**
     * Relation : Drone qui a capté la vidéo.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }

    /**
     * Relation : Caméra utilisée pour l'enregistrement.
     */
    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class, 'camera_id');
    }
}

