<?php

namespace App\Enums;

enum ResultatEmission: string
{
    case AnimauxPartis = 'animaux_partis';
    case SansEffet = 'sans_effet';
    case Indetermine = 'indetermine';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
