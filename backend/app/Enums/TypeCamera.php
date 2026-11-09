<?php

namespace App\Enums;

enum TypeCamera: string
{
    case Rgb = 'rgb';
    case Thermique = 'thermique';
    case Infrarouge = 'infrarouge';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
