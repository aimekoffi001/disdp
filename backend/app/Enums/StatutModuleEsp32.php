<?php

namespace App\Enums;

enum StatutModuleEsp32: string
{
    case EnLigne = 'en_ligne';
    case HorsLigne = 'hors_ligne';
    case Erreur = 'erreur';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
