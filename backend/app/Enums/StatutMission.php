<?php

namespace App\Enums;

enum StatutMission: string
{
    case Planifiee = 'planifiee';
    case EnCours = 'en_cours';
    case Terminee = 'terminee';
    case Annulee = 'annulee';
    case Echouee = 'echouee';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
