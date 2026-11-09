<?php

namespace App\Enums;

enum TypeCapteur: string
{
    case Gps = 'gps';
    case Temperature = 'temperature';
    case Humidite = 'humidite';
    case Pression = 'pression';
    case Tension = 'tension';
    case Courant = 'courant';
    case Autre = 'autre';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
