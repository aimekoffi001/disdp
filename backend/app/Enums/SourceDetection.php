<?php

namespace App\Enums;

enum SourceDetection: string
{
    case Camera = 'camera';
    case Capteur = 'capteur';
    case Manuelle = 'manuelle';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
