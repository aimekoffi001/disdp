<?php

namespace App\Enums;

enum QualiteMesure: string
{
    case Valide = 'valide';
    case Douteuse = 'douteuse';
    case Invalide = 'invalide';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
