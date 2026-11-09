<?php

namespace App\Enums;

enum CategorieSon: string
{
    case CriPredateur = 'cri_predateur';
    case Ultrason = 'ultrason';
    case BruitFort = 'bruit_fort';
    case Sirene = 'sirene';
    case Autre = 'autre';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
