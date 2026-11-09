<?php

namespace App\Enums;

enum ActionPointVol: string
{
    case Passage = 'passage';
    case Survol = 'survol';
    case EmissionSonore = 'emission_sonore';
    case Photo = 'photo';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
