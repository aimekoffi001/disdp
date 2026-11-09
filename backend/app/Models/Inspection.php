<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inspection extends Model
{
    use HasFactory;

    protected $table = 'inspections';

    protected $fillable = [
        'code_inspection',
        'drone_id',
        'utilisateur_id',
        'type_inspection',
        'date_inspection',
        'etat_helices',
        'etat_moteurs',
        'etat_batterie',
        'etat_capteurs',
        'etat_cameras',
        'etat_chassis',
        'resultat_global',
        'commentaires',
    ];

    protected function casts(): array
    {
        return [
            'date_inspection' => 'datetime',
        ];
    }

    /**
     * Relation : Un drone peut subir plusieurs inspections.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }

    /**
     * Relation : Un utilisateur peut effectuer plusieurs inspections.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }
}
