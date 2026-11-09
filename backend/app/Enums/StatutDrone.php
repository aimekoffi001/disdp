<?php

namespace App\Enums;

enum StatutDrone: string
{
    case Disponible = 'disponible';
    case EnVol = 'en_vol';
    case EnMaintenance = 'en_maintenance';
    case HorsLigne = 'hors_ligne';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
