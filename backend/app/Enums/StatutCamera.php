<?php

namespace App\Enums;

enum StatutCamera: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Defectueuse = 'defectueuse';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
