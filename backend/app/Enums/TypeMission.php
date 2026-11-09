<?php

namespace App\Enums;

enum TypeMission: string
{
    case Surveillance = 'surveillance';
    case Dissuasion = 'dissuasion';
    case Test = 'test';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
