<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Camera extends Model
{
    use HasFactory;

    protected $table = 'cameras';

    protected $fillable = [
        'drone_id',
        'nom',
        'modele',
        'type_camera',
        'resolution',
        'angle_vision',
        'zoom_optique',
        'flux_rtsp_url',
        'statut',
    ];

    /**
     * Relation : La caméra appartient à un drone.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }

    /**
     * Relation : Vidéos capturées par cette caméra.
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'camera_id');
    }
}
