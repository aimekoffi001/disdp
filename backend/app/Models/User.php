<?php

namespace App\Models;

/**
 * Modèle User pour compatibilité avec le système d'authentification Laravel.
 * Hérite directement du modèle Utilisateur (table 'utilisateurs').
 */
class User extends Utilisateur
{
    // Toutes les propriétés et relations sont définies dans Utilisateur.
}
