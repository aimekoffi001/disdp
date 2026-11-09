<?php

namespace App\Enums;

enum StatutDetection: string
{
    case Nouvelle = 'nouvelle';
    case Confirmee = 'confirmee';
    case FausseAlerte = 'fausse_alerte';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
