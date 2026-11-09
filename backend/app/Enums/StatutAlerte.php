<?php

namespace App\Enums;

enum StatutAlerte: string
{
    case Nouvelle = 'nouvelle';
    case Acquittee = 'acquittee';
    case Resolue = 'resolue';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
