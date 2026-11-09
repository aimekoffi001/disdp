<?php

namespace App\Enums;

enum NiveauNuisance: string
{
    case Faible = 'faible';
    case Moyen = 'moyen';
    case Eleve = 'eleve';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
