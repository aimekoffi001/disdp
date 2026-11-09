<?php

namespace App\Enums;

enum RoleUser: string
{
    case Administrateur = 'administrateur';
    case Operateur = 'operateur';
    case Technicien = 'technicien';
    case Observateur = 'observateur';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
