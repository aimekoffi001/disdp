<?php

namespace App\Enums;

enum TypeSessionVideo: string
{
    case Direct = 'direct';
    case Enregistrement = 'enregistrement';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
