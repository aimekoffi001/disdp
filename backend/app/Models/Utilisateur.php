<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Utilisateur extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Table associée au modèle.
     */
    protected $table = 'utilisateurs';

    /**
     * Attributs assignables en masse.
     */
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'role',
        'telephone',
        'actif',
        'derniere_connexion_at',
    ];

    /**
     * Attributs masqués pour la sérialisation.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Typage automatique des attributs.
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'actif' => 'boolean',
            'derniere_connexion_at' => 'datetime',
        ];
    }

    /**
     * Relation : Un utilisateur peut créer plusieurs missions.
     */
    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'utilisateur_id');
    }

    /**
     * Relation : Un utilisateur peut effectuer plusieurs inspections.
     */
    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'utilisateur_id');
    }

    /**
     * Relation : Un utilisateur peut générer plusieurs historiques.
     */
    public function historiques(): HasMany
    {
        return $this->hasMany(Historique::class, 'utilisateur_id');
    }
}

