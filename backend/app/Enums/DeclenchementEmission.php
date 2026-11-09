<?php

namespace App\Enums;

enum DeclenchementEmission: string
{
    case Automatique = 'automatique';
    case Manuel = 'manuel';
    case Programme = 'programme';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
