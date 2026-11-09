<?php

namespace App\Enums;

enum ResultatInspection: string
{
    case Conforme = 'conforme';
    case Reserves = 'reserves';
    case NonConforme = 'non_conforme';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
