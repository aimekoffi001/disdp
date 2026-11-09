<?php

namespace App\Enums;

enum TypeAlerte: string
{
    case BatterieFaible = 'batterie_faible';
    case PerteSignal = 'perte_signal';
    case HorsZone = 'hors_zone';
    case DetectionAnimal = 'detection_animal';
    case PanneCapteur = 'panne_capteur';
    case TemperatureElevee = 'temperature_elevee';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
