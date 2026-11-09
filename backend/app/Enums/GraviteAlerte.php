<?php

namespace App\Enums;

enum GraviteAlerte: string
{
    case Info = 'info';
    case Avertissement = 'avertissement';
    case Critique = 'critique';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
