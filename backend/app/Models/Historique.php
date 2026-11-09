<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Historique extends Model
{
    use HasFactory;

    protected $table = 'historiques';

    protected $fillable = [
        'utilisateur_id',
        'drone_id',
        'mission_id',
        'action',
        'description',
        'ip_address',
        'user_agent',
        'details_json',
        'date_action',
    ];

    protected function casts(): array
    {
        return [
            'details_json' => 'array',
            'date_action' => 'datetime',
        ];
    }

    /**
     * Relation : Un utilisateur peut générer plusieurs historiques.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }

    /**
     * Relation : Drone associé à l'action.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }

    /**
     * Relation : Mission associée à l'action.
     */
    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class, 'mission_id');
    }
}

