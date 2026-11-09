<?php

namespace App\Enums;

enum GraviteIncident: string
{
    case Mineure = 'mineure';
    case Majeure = 'majeure';
    case Critique = 'critique';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
