<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ZoneStatique extends Model
{
    use HasFactory;

    protected $table = 'zones_statiques';

    protected $fillable = [
        'nom_zone',
        'code_zone',
        'type_zone',
        'surface_hectares',
        'latitude_centre',
        'longitude_centre',
        'altitude_reference',
        'limites_gps',
        'niveau_risque',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'surface_hectares' => 'decimal:2',
            'latitude_centre' => 'decimal:7',
            'longitude_centre' => 'decimal:7',
            'altitude_reference' => 'decimal:2',
            'limites_gps' => 'array',
        ];
    }

    /**
     * Relation : Une zone statique peut être associée à plusieurs missions.
     */
    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'zone_statique_id');
    }
}

