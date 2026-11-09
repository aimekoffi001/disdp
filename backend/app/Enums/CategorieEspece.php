<?php

namespace App\Enums;

enum CategorieEspece: string
{
    case Oiseau = 'oiseau';
    case Rongeur = 'rongeur';
    case Mammifere = 'mammifere';
    case Primate = 'primate';
    case Autre = 'autre';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
