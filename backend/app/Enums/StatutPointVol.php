<?php

namespace App\Enums;

enum StatutPointVol: string
{
    case AAtteindre = 'a_atteindre';
    case Atteint = 'atteint';
    case Ignore = 'ignore';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
