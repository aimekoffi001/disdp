<?php

namespace App\Enums;

enum TypeInspection: string
{
    case ControleInitial = 'controle_initial';
    case Preventive = 'preventive';
    case Corrective = 'corrective';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
