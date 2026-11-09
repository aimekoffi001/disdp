<?php

namespace App\Enums;

enum StatutSessionVideo: string
{
    case Active = 'active';
    case Terminee = 'terminee';
    case Interrompue = 'interrompue';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
