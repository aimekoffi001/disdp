<?php

namespace App\Enums;

enum StatutIncident: string
{
    case Ouvert = 'ouvert';
    case EnAnalyse = 'en_analyse';
    case Resolu = 'resolu';
    case Clos = 'clos';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
