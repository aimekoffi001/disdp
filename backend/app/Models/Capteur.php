<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Capteur extends Model
{
    use HasFactory;

    protected $table = 'capteurs';

    protected $fillable = [
        'drone_id',
        'nom',
        'type_capteur',
        'unite_mesure',
        'derniere_valeur',
        'frequence_echantillonnage_hz',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'derniere_valeur' => 'decimal:2',
            'frequence_echantillonnage_hz' => 'integer',
        ];
    }

    /**
     * Relation : Le capteur appartient à un drone.
     */
    public function drone(): BelongsTo
    {
        return $this->belongsTo(Drone::class, 'drone_id');
    }
}
