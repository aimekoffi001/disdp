<?php

namespace App\Enums;

enum ComposantIncident: string
{
    case Moteur = 'moteur';
    case Batterie = 'batterie';
    case Helice = 'helice';
    case Capteur = 'capteur';
    case Camera = 'camera';
    case ModuleEsp32 = 'module_esp32';
    case HautParleur = 'haut_parleur';
    case Autre = 'autre';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
